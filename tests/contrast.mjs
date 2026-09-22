import { launch } from './lib/browser.mjs';
import { startPreview } from './lib/server.mjs';
import { parseColor, composite, contrast } from './lib/color.mjs';
import { ok, section, finish } from './lib/report.mjs';

/**
 * Token pairs that carry text, with the ratio each must clear.
 *
 * `layers` are painted onto `bg` in order before the ratio against `fg` is
 * taken — that is how a translucent wash over a band is measured at its
 * darkest point rather than its average.
 */
const PAIRS = [
  { name: 'body text on page ground', fg: 'var(--text)', bg: 'var(--bg)', min: 4.5 },
  { name: 'muted text on page ground', fg: 'var(--text-muted)', bg: 'var(--bg)', min: 4.5 },
  { name: 'body text on inset band', fg: 'var(--text)', bg: 'var(--bg-inset)', min: 4.5 },
  { name: 'muted text on inset band', fg: 'var(--text-muted)', bg: 'var(--bg-inset)', min: 4.5 },
  { name: 'body text on raised surface', fg: 'var(--text)', bg: 'var(--bg-raised)', min: 4.5 },
  { name: 'inverted text on ink band', fg: 'var(--text-invert)', bg: 'var(--bg-invert)', min: 4.5 },
  { name: 'muted ink text on ink band', fg: 'var(--text-invert-muted)', bg: 'var(--bg-invert)', min: 4.5 },
  { name: 'accent text on page ground', fg: 'var(--accent-text)', bg: 'var(--bg)', min: 4.5 },
  { name: 'button label on accent', fg: 'var(--on-accent)', bg: 'var(--accent)', min: 4.5 },
  { name: 'orange-on-dark link on ink band', fg: 'var(--cut-light)', bg: 'var(--bg-invert)', min: 4.5 },
  { name: 'hairline against page ground', fg: 'var(--line-strong)', bg: 'var(--bg)', min: 1.2 },
  // The grid wash at its DARKEST point: two 50%-alpha grid lines crossing over
  // the inset band. Averaging the wash would understate this by design.
  {
    name: 'body text over the grid wash (two crossing lines)',
    fg: 'var(--text)',
    bg: 'var(--bg-inset)',
    layers: ['var(--grid-line)', 'var(--grid-line)'],
    min: 4.5,
  },
  {
    name: 'muted text over the grid wash (two crossing lines)',
    fg: 'var(--text-muted)',
    bg: 'var(--bg-inset)',
    layers: ['var(--grid-line)', 'var(--grid-line)'],
    min: 4.5,
  },
];

const { base, stop } = await startPreview();
const browser = await launch();

try {
  for (const theme of ['light', 'dark']) {
    section(`contrast — ${theme}`);
    const ctx = await browser.newContext({ colorScheme: theme });
    const page = await ctx.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'load' });

    // The browser resolves var() and color-mix() for us; reading the computed
    // `color` off a throwaway probe is the only reliable way to get a real
    // rgb()/rgba() out of an arbitrary colour expression.
    const resolve = (expr) =>
      page.evaluate((e) => {
        const probe = document.createElement('span');
        probe.style.color = e;
        document.body.appendChild(probe);
        const value = getComputedStyle(probe).color;
        probe.remove();
        return value;
      }, expr);

    for (const pair of PAIRS) {
      let ground = parseColor(await resolve(pair.bg));
      for (const layer of pair.layers ?? []) {
        ground = composite(parseColor(await resolve(layer)), ground);
      }
      const ratio = contrast(parseColor(await resolve(pair.fg)), ground);
      ok(
        ratio >= pair.min,
        `${pair.name} ≥ ${pair.min}:1`,
        `measured ${ratio.toFixed(2)}:1`
      );
    }

    await ctx.close();
  }
} finally {
  await browser.close();
  stop();
}

finish('contrast');
