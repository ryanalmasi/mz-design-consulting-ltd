import { launch } from './lib/browser.mjs';
import { startPreview } from './lib/server.mjs';
import { pageUrls } from './lib/pages.mjs';
import { ok, section, finish } from './lib/report.mjs';

/**
 * The failure this exists to catch: scroll-driven reveals that hide content a
 * browser then cannot un-hide. Three ways that happens —
 *   1. `animation-timeline` unsupported, so the "from" state sticks;
 *   2. prefers-reduced-motion, where the animation is neutralised;
 *   3. the element is already inside the viewport on load, where a view()
 *      timeline can settle at the wrong end of its range.
 *
 * In all three the content must be fully rendered. Nothing here may depend on
 * an animation running.
 */
const MIN_OPACITY = 0.99;

async function assertRevealsVisible(page, label) {
  const bad = await page.$$eval('.reveal', (els) =>
    els
      .map((el) => ({
        sel: `${el.tagName.toLowerCase()}.${el.className}`,
        opacity: Number(getComputedStyle(el).opacity),
        visibility: getComputedStyle(el).visibility,
      }))
      .filter((r) => r.opacity < 0.99 || r.visibility === 'hidden')
  );
  ok(bad.length === 0, label, bad.map((b) => `${b.sel} opacity=${b.opacity} visibility=${b.visibility}`).join('\n      '));
  return bad;
}

const { base, stop } = await startPreview();
const browser = await launch();
const urls = pageUrls();
let revealCount = 0;

try {
  // 1 — animation-timeline unsupported. Simulated by deleting the property
  //     support at the CSS level: inject a stylesheet that neutralises the
  //     timeline, which is what an unsupporting engine effectively does with
  //     the @supports guard in place.
  section('motion — animation-timeline unsupported');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    for (const url of urls) {
      await page.goto(base + url, { waitUntil: 'load' });
      // Force the @supports guard to be irrelevant by disabling the feature's
      // effect: any element that relies on it must already be visible.
      // Injected per-page via addStyleTag (not ctx.addInitScript) because
      // document.documentElement is null at the point an addInitScript
      // callback runs in this Playwright/Chromium combination — that
      // injection silently threw and never applied. addStyleTag operates on
      // the already-loaded page's document, so it's guaranteed to exist.
      await page.addStyleTag({
        content: '* { animation-timeline: none !important; animation-name: none !important; }',
      });
      revealCount += await page.locator('.reveal').count();
      await assertRevealsVisible(page, `all .reveal content rendered without animation — ${url}`);
    }
    await ctx.close();
  }

  // 2 — prefers-reduced-motion: reduce
  section('motion — prefers-reduced-motion: reduce');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    for (const url of urls) {
      await page.goto(base + url, { waitUntil: 'load' });
      await assertRevealsVisible(page, `all .reveal content rendered under reduced motion — ${url}`);
    }
    await ctx.close();
  }

  // 3 — already in the viewport on load, including a deep link mid-page.
  section('motion — in-viewport on load');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    for (const url of urls) {
      await page.goto(base + url, { waitUntil: 'load' });
      await page.waitForTimeout(400);
      const above = await page.$$eval('.reveal', (els) =>
        els
          .filter((el) => el.getBoundingClientRect().top < window.innerHeight)
          .map((el) => ({ sel: `${el.tagName.toLowerCase()}.${el.className}`, opacity: Number(getComputedStyle(el).opacity) }))
          .filter((r) => r.opacity < 0.99)
      );
      ok(above.length === 0, `.reveal elements in the first viewport are not stuck hidden — ${url}`, above.map((a) => `${a.sel} opacity=${a.opacity}`).join('\n      '));
    }

    // A mid-page deep link: the services page has in-page anchors. Only
    // elements the jump actually brought near the viewport are in scope —
    // content further down the page is legitimately still below the fold
    // and must not be flagged, same filter as the per-page loop above.
    await page.goto(`${base}/services.html#stormwater`, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const nearAfterJump = await page.$$eval('.reveal', (els) =>
      els
        .filter((el) => el.getBoundingClientRect().top < window.innerHeight)
        .map((el) => ({ sel: `${el.tagName.toLowerCase()}.${el.className}`, opacity: Number(getComputedStyle(el).opacity) }))
        .filter((r) => r.opacity < 0.99)
    );
    ok(nearAfterJump.length === 0, '.reveal content visible after a mid-page deep link', nearAfterJump.map((a) => `${a.sel} opacity=${a.opacity}`).join('\n      '));
    await ctx.close();
  }

  // 4 — regression guard: the reveal is genuinely ANIMATING, not just "never
  //     stuck". Checks 1–3 above only assert content is visible, and this
  //     bug class's actual failure mode (a CSS minifier folding
  //     `animation`/`animation-timeline` into an unsupported shorthand, as
  //     documented at length in global.css next to --reveal-timeline) makes
  //     animation-name compute to `none`, so the element falls back to its
  //     resting, fully-opaque state — which is indistinguishable from
  //     "working" to every check above. The only way to actually catch that
  //     regression is to find a genuinely below-the-fold .reveal element at
  //     load and confirm it is NOT at full opacity, proving the timeline is
  //     really driving the animation rather than the element just sitting at
  //     its default visible state.
  section('motion — reveal is genuinely animating (regression guard)');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'load' });
    await page.waitForTimeout(200);

    const belowFold = await page.$$eval('.reveal', (els) =>
      els
        .map((el) => ({
          sel: `${el.tagName.toLowerCase()}.${el.className}`,
          top: el.getBoundingClientRect().top,
          opacity: Number(getComputedStyle(el).opacity),
          animationName: getComputedStyle(el).animationName,
        }))
        .filter((r) => r.top >= window.innerHeight)
    );

    ok(
      belowFold.length > 0,
      '/index.html has at least one .reveal element fully below the fold at load (test precondition)',
      `found ${belowFold.length}`
    );

    const genuinelyAnimating = belowFold.filter((r) => r.opacity < 0.99 && r.animationName !== 'none');
    ok(
      belowFold.length === 0 || genuinelyAnimating.length > 0,
      'at least one below-the-fold .reveal element is measurably not at full opacity on load, proving the scroll-driven animation is actually running',
      belowFold.map((r) => `${r.sel} top=${Math.round(r.top)} opacity=${r.opacity} animationName=${r.animationName}`).join('\n      ')
    );

    await ctx.close();
  }
} finally {
  await browser.close();
  stop();
}

console.log(`  (${revealCount} .reveal element(s) found across the site)`);
finish('motion');
