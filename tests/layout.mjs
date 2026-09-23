import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './lib/browser.mjs';
import { startPreview } from './lib/server.mjs';
import { pageUrls } from './lib/pages.mjs';
import { ok, section, finish } from './lib/report.mjs';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const baseline = JSON.parse(readFileSync(fileURLToPath(new URL('./baseline.json', import.meta.url)), 'utf8'));

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '390x844', width: 390, height: 844 },
];
const THEMES = ['light', 'dark'];

// --- Shipped JavaScript -----------------------------------------------------
// Constraint 3 of the spec: the visual pass is CSS-only, so this number must
// not move. Counts every .js emitted into dist/, not just _astro/.
const jsBytes = (() => {
  let total = 0;
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const s = statSync(full);
      if (s.isDirectory()) walk(full);
      else if (entry.endsWith('.js')) total += s.size;
    }
  };
  walk(DIST);
  return total;
})();

section('payload');
console.log(`  shipped JS: ${jsBytes} bytes (baseline ${baseline.js.bytes})`);
ok(
  jsBytes <= baseline.js.bytes,
  'shipped JavaScript did not grow',
  `now ${jsBytes}, baseline ${baseline.js.bytes}`
);

// --- Per-page rendering -----------------------------------------------------
const { base, stop } = await startPreview();
const browser = await launch();
const urls = pageUrls();

try {
  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      section(`layout — ${theme} @ ${vp.name}`);
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
      });
      const page = await ctx.newPage();

      const problems = [];
      page.on('console', (m) => {
        if (m.type() === 'error') problems.push(`console: ${m.text()}`);
      });
      page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

      for (const url of urls) {
        problems.length = 0;
        await page.goto(base + url, { waitUntil: 'load' });

        const overflow = await page.evaluate(() => {
          const el = document.documentElement;
          // The widest element that sticks out, for a useful failure message.
          let worst = null;
          if (el.scrollWidth > el.clientWidth) {
            for (const node of document.querySelectorAll('body *')) {
              const r = node.getBoundingClientRect();
              if (r.right > el.clientWidth + 1 || r.left < -1) {
                worst = `${node.tagName.toLowerCase()}.${node.className || '(no class)'} → ${Math.round(r.left)}..${Math.round(r.right)}`;
                break;
              }
            }
          }
          return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, worst };
        });

        ok(
          overflow.scrollWidth <= overflow.clientWidth,
          `no horizontal overflow — ${url}`,
          `scrollWidth ${overflow.scrollWidth} > clientWidth ${overflow.clientWidth}${overflow.worst ? `; first offender ${overflow.worst}` : ''}`
        );
        ok(problems.length === 0, `no console errors — ${url}`, problems.join('\n      '));
      }

      await ctx.close();
    }
  }
} finally {
  await browser.close();
  stop();
}

finish('layout');
