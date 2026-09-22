# Verification harness

Plain Node scripts driving the Chromium already cached by a previous Playwright
install. There is no test framework and no config file.

```bash
nvm use            # Node >= 22.12; Astro 7 hard-exits below it
npm test           # build, then every check below
```

Individual checks, each of which needs `dist/` to exist (`npm run build`):

| Script | Checks |
|---|---|
| `npm run test:axe` | axe-core over every built page × {1440×900, 390×844} × {light, dark}, against `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice`. Must be 0 violations. Also holds the count of *undetermined* colour-contrast nodes to `baseline.json`. |
| `npm run test:layout` | Horizontal overflow, console and page errors, and total shipped JavaScript against `baseline.json`. |
| `npm run test:contrast` | WCAG ratios computed analytically from the live token values, in both themes. |
| `npm run test:interaction` | Project filter, mobile drawer, FAQ, and the card imagery's keyboard parity. |
| `npm run test:motion` | That no `.reveal` content is ever stuck hidden — without `animation-timeline`, under reduced motion, or when already in the viewport on load. |

## `baseline.json`

Two numbers that may go down and must not go up:

- `axe.colorContrastIncomplete` — nodes where axe could not determine contrast,
  usually text over an image. Not violations, but the exact place a new
  decorative ground would hide one.
- `js.bytes` — total `.js` in `dist/`. The site ships ~2 KB and the visual work
  is CSS-only.

Re-measure deliberately, never to make a failure go away: run the script, read
the printed number, and write it in as its own commit with a reason.

## The browser

`playwright-core` ships no browser binary. `lib/browser.mjs` finds the newest
`~/Library/Caches/ms-playwright/chromium-*/chrome-mac/Chromium.app/…` on the
machine. Override with `CHROMIUM_PATH=/path/to/chromium`, or install one with
`npx playwright install chromium`.

## Why `.mjs`

`tsconfig.json` includes `**/*.ts`, `**/*.tsx` and `**/*.astro` only. Writing
these as `.mjs` keeps them out of `astro check`, so the repo's 0 errors /
0 warnings / 0 hints bar measures the site rather than the harness. A `.ts`
file added here would enter the type check and must satisfy
`astro/tsconfigs/strict`.
