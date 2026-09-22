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
} finally {
  await browser.close();
  stop();
}

finish('visual');
