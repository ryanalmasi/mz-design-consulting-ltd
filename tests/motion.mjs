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
    await ctx.addInitScript(() => {
      // Force the @supports guard to be irrelevant by disabling the feature's
      // effect: any element that relies on it must already be visible.
      const style = document.createElement('style');
      style.textContent = '* { animation-timeline: none !important; animation-name: none !important; }';
      document.documentElement.appendChild(style);
    });
    const page = await ctx.newPage();
    for (const url of urls) {
      await page.goto(base + url, { waitUntil: 'load' });
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

    // A mid-page deep link: the services page has in-page anchors.
    await page.goto(`${base}/services.html#stormwater`, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    await assertRevealsVisible(page, '.reveal content visible after a mid-page deep link');
    await ctx.close();
  }
} finally {
  await browser.close();
  stop();
}

console.log(`  (${revealCount} .reveal element(s) found across the site)`);
finish('motion');
