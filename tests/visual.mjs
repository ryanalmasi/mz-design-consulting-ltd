import { launch } from './lib/browser.mjs';
import { startPreview } from './lib/server.mjs';
import { ok, section, finish } from './lib/report.mjs';

const { base, stop } = await startPreview();
const browser = await launch();

const px = (v) => Number.parseFloat(v);

try {
  // ---- Display type scale (spec §4) ---------------------------------------
  section('type scale');
  {
    const wide = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const wp = await wide.newPage();
    await wp.goto(`${base}/index.html`, { waitUntil: 'load' });

    const h1Wide = await wp.$eval('h1', (el) => getComputedStyle(el).fontSize);
    const h1Weight = await wp.$eval('h1', (el) => getComputedStyle(el).fontWeight);
    ok(px(h1Wide) >= 76, 'h1 reaches the new ceiling at 1440px', `${h1Wide} (want ≥ 76px)`);
    ok(h1Weight === '800', 'h1 uses the display weight', `font-weight ${h1Weight}`);

    const h2Wide = await wp.$eval('h2', (el) => getComputedStyle(el).fontSize);
    ok(px(h2Wide) >= 55, 'h2 grows at 1440px', `${h2Wide} (want ≥ 55px)`);
    await wide.close();

    const narrow = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const np = await narrow.newPage();
    await np.goto(`${base}/index.html`, { waitUntil: 'load' });

    const h1Narrow = await np.$eval('h1', (el) => getComputedStyle(el).fontSize);
    ok(
      Math.abs(px(h1Narrow) - 40) < 0.6,
      'h1 floor is unchanged at 390px',
      `${h1Narrow} (want 40px — the clamp minimum must not move)`
    );

    const h3 = await np.$eval('h3', (el) => getComputedStyle(el).fontSize);
    ok(Math.abs(px(h3) - 22) < 0.6, 'h3 is untouched', `${h3} (want 22px)`);

    const body = await np.$eval('p', (el) => getComputedStyle(el).fontSize);
    ok(px(body) >= 16, 'body type floor is untouched', `${body}`);
    await narrow.close();
  }

  // ---- Drawing devices (spec §5) ------------------------------------------
  section('drawing devices');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'load' });

    const tokens = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return {
        gridSize: cs.getPropertyValue('--grid-size').trim(),
        hatchGap: cs.getPropertyValue('--hatch-gap').trim(),
        gridLine: cs.getPropertyValue('--grid-line').trim(),
      };
    });
    ok(tokens.gridSize === '32px', '--grid-size defined', tokens.gridSize || '(unset)');
    ok(tokens.hatchGap === '7px', '--hatch-gap defined', tokens.hatchGap || '(unset)');
    ok(tokens.gridLine.length > 0, '--grid-line defined', '(unset)');

    const placement = await page.evaluate(() => ({
      insetBandsWithGrid: document.querySelectorAll('.band-inset.sheet-grid').length,
      insetBands: document.querySelectorAll('.band-inset').length,
      gridOnInk: document.querySelectorAll('.band-ink.sheet-grid').length,
      chainage: document.querySelectorAll('.chainage').length,
      matchLine: document.querySelectorAll('.match-line').length,
      chainageWithText: Array.from(document.querySelectorAll('.chainage')).filter(
        (el) => el.textContent.trim().length > 0
      ).length,
    }));

    ok(
      placement.insetBandsWithGrid === placement.insetBands,
      'every inset band on the homepage carries the grid wash',
      `${placement.insetBandsWithGrid} of ${placement.insetBands}`
    );
    ok(placement.gridOnInk === 0, 'the grid wash is not applied to ink bands', `${placement.gridOnInk} found`);
    ok(placement.chainage >= 1, 'the homepage carries a chainage rule', `${placement.chainage} found`);
    ok(placement.matchLine >= 1, 'the homepage carries a match line', `${placement.matchLine} found`);
    ok(
      placement.chainageWithText === 0,
      'no .chainage carries text — tick geometry only, never invented station numerals',
      `${placement.chainageWithText} with text`
    );

    const leaked = await page.$$eval(
      '.sheet-grid, .hatch-cut, .hatch-fill, .reg-marks, .chainage, .match-line',
      (els) =>
        els
          .filter((el) => el.dataset.decorative === 'true' && el.getAttribute('aria-hidden') !== 'true')
          .map((el) => `${el.tagName.toLowerCase()}.${el.className}`)
    );
    ok(leaked.length === 0, 'purely decorative devices are aria-hidden', leaked.join(', '));

    await ctx.close();
  }

  // ---- Nav condensed state (spec §7, §13.1) -------------------------------
  section('nav condense');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${base}/services.html`, { waitUntil: 'load' });

    const navHTop = await page.$eval('.nav-inner', (el) => el.getBoundingClientRect().height);

    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(400);
    const navHScrolled = await page.$eval('.nav-inner', (el) => el.getBoundingClientRect().height);

    ok(
      Math.abs(navHTop - navHScrolled) < 0.5,
      'the bar height does not change on scroll',
      `${navHTop}px at top, ${navHScrolled}px scrolled — --nav-h is load-bearing for six scroll-offset rules`
    );

    const token = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h').trim()
    );
    ok(token === '68px', '--nav-h is unchanged', token);

    // The condense itself: the logo scales down.
    //
    // NOTE ON DEVIATION FROM THE BRIEF: the brief's scrollTo(0, 0) here used the
    // two-argument form and read getComputedStyle in the same tick, with no
    // wait. Two real timing effects make that combination read a stale value
    // no matter what the implementation is:
    //  1. Two-arg scrollTo() respects `html { scroll-behavior: smooth }`
    //     (global.css:27, pre-existing, unrelated to this task), so the scroll
    //     position itself hadn't reached 0 yet (measured: scrollY was still
    //     718 of 800 immediately after the call, and only 56 after a 400ms
    //     wait) — `behavior: 'instant'` fixes that part.
    //  2. Even with an instant scroll, `window.scrollY` updates synchronously
    //     but the scroll-timeline-driven custom property does not — it only
    //     recomputes on the next rendering frame (measured directly: reading
    //     --logo-scale in the same tick after an instant scrollTo(0,0) still
    //     showed the stale 0.86; after a rAF or a short wait it correctly
    //     showed 1). So a wait is needed after the reset scroll too, exactly
    //     as already used below for scaleScrolled.
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
    await page.waitForTimeout(400);
    const scaleTop = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.site-nav')).getPropertyValue('--logo-scale').trim()
    );
    await page.evaluate(() => window.scrollTo({ top: 800, left: 0, behavior: 'instant' }));
    await page.waitForTimeout(400);
    const scaleScrolled = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.site-nav')).getPropertyValue('--logo-scale').trim()
    );
    ok(
      scaleTop !== scaleScrolled,
      'the logo scale changes on scroll',
      `--logo-scale ${scaleTop || '(unset)'} → ${scaleScrolled || '(unset)'}`
    );

    // And the anchor still lands clear of the bar.
    await page.goto(`${base}/services.html#stormwater`, { waitUntil: 'load' });
    await page.waitForTimeout(600);
    const anchorTop = await page.$eval('#stormwater', (el) => el.getBoundingClientRect().top);
    const barBottom = await page.$eval('.site-nav', (el) => el.getBoundingClientRect().bottom);
    ok(anchorTop >= barBottom - 1, 'a deep-linked anchor lands below the nav bar', `anchor at ${Math.round(anchorTop)}, bar ends at ${Math.round(barBottom)}`);

    await ctx.close();
  }
} finally {
  await browser.close();
  stop();
}

finish('visual');
