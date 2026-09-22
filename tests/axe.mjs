import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { launch } from './lib/browser.mjs';
import { startPreview } from './lib/server.mjs';
import { pageUrls } from './lib/pages.mjs';
import { ok, section, finish } from './lib/report.mjs';

const require = createRequire(import.meta.url);
const AXE = require.resolve('axe-core/axe.min.js');
const baseline = JSON.parse(readFileSync(fileURLToPath(new URL('./baseline.json', import.meta.url)), 'utf8'));

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '390x844', width: 390, height: 844 },
];
const THEMES = ['light', 'dark'];

const { base, stop } = await startPreview();
const browser = await launch();
const urls = pageUrls();
let incompleteTotal = 0;

try {
  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      section(`axe — ${theme} @ ${vp.name}`);
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
        reducedMotion: 'no-preference',
      });
      const page = await ctx.newPage();

      for (const url of urls) {
        await page.goto(base + url, { waitUntil: 'load' });
        await page.addScriptTag({ path: AXE });
        const result = await page.evaluate(
          (tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags } }),
          TAGS
        );

        ok(
          result.violations.length === 0,
          `${url}`,
          result.violations
            .map((v) => `${v.id} × ${v.nodes.length}: ${v.nodes[0]?.target.join(' ')}`)
            .join('\n      ')
        );

        // Contrast axe could not determine — usually text over an image or a
        // gradient. Not a violation, but it is exactly where a new decorative
        // ground would hide one, so the count is held to a committed baseline.
        incompleteTotal += result.incomplete
          .filter((i) => i.id === 'color-contrast')
          .reduce((n, i) => n + i.nodes.length, 0);
      }

      await ctx.close();
    }
  }
} finally {
  await browser.close();
  stop();
}

section('axe — undetermined contrast');
ok(
  incompleteTotal <= baseline.axe.colorContrastIncomplete,
  'colour-contrast "incomplete" nodes did not increase',
  `now ${incompleteTotal}, baseline ${baseline.axe.colorContrastIncomplete}`
);
console.log(`  (measured ${incompleteTotal} undetermined-contrast nodes across ${urls.length} pages × 4 renderings)`);

finish('axe');
