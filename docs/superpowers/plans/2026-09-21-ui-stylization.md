# UI Stylization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise the production values of the existing drawing-sheet visual language — display type scale, a depth layer built from drawing devices, a unifying duotone on the stock imagery, and CSS-only motion — behind a persistent verification harness that proves nothing regressed.

**Architecture:** Two passes, in order. **Pass A** creates `tests/` and runs it against the *current* UI to establish a committed green baseline (this is also the prerequisite for backlog item 9, CI). **Pass B** does the visual work, adding an assertion before each change so a regression shows up as a test flipping rather than as a number someone has to remember. Every visual addition is CSS-only; the site's ~2 KB of JavaScript does not grow.

**Tech Stack:** Astro 7 (static, `build.format: 'file'`), TypeScript, plain CSS with custom properties. Test harness: `playwright-core` + `axe-core` as devDependencies, driving the already-cached Chromium at `~/Library/Caches/ms-playwright/chromium-1179/chrome-mac/Chromium.app/Contents/MacOS/Chromium`. No test framework — the scripts are plain `.mjs` run by `node`.

**Spec:** [`docs/superpowers/specs/2026-09-21-ui-stylization-design.md`](../specs/2026-09-21-ui-stylization-design.md) — read it alongside this plan. This plan argues from that spec and does not restate its reasoning.

---

## Decisions resolved before writing this plan

The spec's §13 listed three open items. All three are now closed; do not reopen them.

| Spec item | Decision | Consequence for this plan |
|---|---|---|
| **§13.1** — what the nav condenses | **Padding and logo scale only. `--nav-h` never changes.** | Task 13. The six rules that read `var(--nav-h)` are not touched, so in-page anchors keep landing correctly. |
| **§13.2** — does `tests/` ship in this pass | **Two passes. `tests/` first, against the current UI.** | Tasks 1–6 are Pass A; tasks 7–15 are Pass B. Pass A is committed and green before any visual change. |
| **§13.3** — the `.pc-category` contrast check | **Dropped.** `.pc-category` is `background: var(--ink)` (opaque), so the duotone underneath cannot affect it. | Task 10 asserts it is *still opaque* instead of measuring it over imagery. |

---

## Global Constraints

Every task's requirements implicitly include this section. Values are copied verbatim from `CLAUDE.md` and spec §3.

- **Node ≥ 22.12.0.** The machine default is 22.11.0 and Astro 7 hard-exits below the floor. Every shell that runs `npm` or `node` must first run:
  ```bash
  export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
  ```
  The Homebrew Node 23 install on this machine is broken (its `node` binary is missing). Do not use it.
- **`npm run verify` stays at 0 errors, 0 warnings, 0 hints.** A new hint is a regression, not noise.
- **axe-core stays at 0 violations**, every page × {1440×900, 390×844} × {light, dark}, against `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice`.
- **Total shipped JS stays at roughly 2 KB.** Every visual addition in Pass B is CSS-only. `playwright-core` and `axe-core` are devDependencies and never enter `dist/`.
- **The three orange variants `--cut`, `--cut-text`, `--cut-light` are not consolidated.** `tokens.css` records which ratio each one clears.
- **Dark mode has parity.** Any new dark ground sets an explicit `color` (gotcha #2) and `--muted-ink` (gotcha #4).
- **No horizontal overflow at 390px**, on any page.
- **The hero diagram's solved geometry is not altered.** The existing ground crosses the proposed grade at exactly `x=281.5` and `x=684`. Motion may animate strokes; it may not move points.
- **Monospace is reserved for real measured values.** `.chainage` carries tick geometry only, never invented station numerals (spec §5).
- **No content, routing, schema or form changes.** `functions/api/contact.ts`, `src/content/**`, `src/content.config.ts` and `src/site.config.ts` are out of scope.
- **Branch:** all work is on `revamp`. Commit as you go; do not push (`CLAUDE.md` — push only when the user asks). End every commit message with:
  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  ```

---

## File Structure

### Created

| Path | Responsibility |
|---|---|
| `tests/lib/browser.mjs` | Locates the cached Chromium and launches it. One job: turn "playwright-core has no browser" into a clear error. |
| `tests/lib/server.mjs` | Builds nothing; spawns `astro preview` against an existing `dist/`, waits for readiness, hands back a base URL and a `stop()`. |
| `tests/lib/pages.mjs` | Walks `dist/` for `*.html` and returns the URL list. Adding a project or article automatically enters the sweep. |
| `tests/lib/report.mjs` | Minimal assert/tally/exit-code reporter. Avoids pulling in a test framework for nine scripts. |
| `tests/lib/color.mjs` | WCAG relative luminance, contrast ratio, alpha compositing, and a browser-side colour resolver. |
| `tests/baseline.json` | Committed numbers that are allowed to move only downward: `axe.colorContrastIncomplete`, `js.bytes`. |
| `tests/axe.mjs` | Check 2 — accessibility sweep, all pages × 2 viewports × 2 themes. |
| `tests/layout.mjs` | Checks 4, 8, 9 — horizontal overflow, console errors, shipped JS payload. |
| `tests/contrast.mjs` | Check 3 — analytic contrast on token pairs and, from Pass B, on the grid wash. |
| `tests/interaction.mjs` | Check 7 and the `CLAUDE.md` interaction list — project filter, mobile drawer, FAQ, duotone keyboard parity. |
| `tests/motion.mjs` | Checks 5, 6 — content stays visible with `animation-timeline` unsupported, under reduced motion, and when already in the viewport on load. |
| `tests/README.md` | How to run the suite, and what each script is for. |

### Modified

| Path | What changes |
|---|---|
| `package.json` | Two devDependencies; `test:*` scripts. |
| `src/styles/tokens.css` | New type-scale, weight, depth and duotone tokens. |
| `src/styles/global.css` | `h1`/`h2` scale; the drawing-device utility classes; the `.reveal` motion block. |
| `src/components/Nav.astro` | Condensed state (padding + logo scale only). |
| `src/components/Logo.astro` | Accepts the `--logo-scale` custom property. |
| `src/components/SectionDiagram.astro` | Draw-in rewritten onto `pathLength="1"`; ground polyline reveal via a clip sweep. |
| `src/components/ProjectCard.astro` | Duotone media, registration ticks, hatch hover accent. |
| `src/components/ArticleCard.astro` | Duotone media. |
| `src/pages/index.astro` | Device placement; the proof strip re-cut as a drawing schedule. |
| `src/pages/about.astro`, `services.astro`, `insights.astro`, `projects.astro` | Device placement and `.reveal` attachment. |
| `docs/IMPROVEMENTS.md` | New subsection under item 7 (spec §11). |
| `docs/superpowers/specs/2026-09-21-ui-stylization-design.md` | Status line updated; §13 marked resolved. |
| `MEMORY.md` | Session entry. |
| `CLAUDE.md` | Verification section points at `tests/` instead of "scripts that no longer exist". |

### Not touched

`src/site.config.ts` · `src/content.config.ts` · `src/content/**` · `src/lib/paths.ts` · `src/layouts/Base.astro` · `functions/**` · `public/**` · `astro.config.mjs`.

---

# PASS A — the verification harness

Pass A must end green against the **current, unmodified** UI. If a check fails here, the correct response is to fix the check or record the number in `tests/baseline.json` — not to change the site. Pass A changes zero pixels.

---

### Task 1: Harness foundation

**Files:**
- Create: `tests/lib/browser.mjs`
- Create: `tests/lib/server.mjs`
- Create: `tests/lib/pages.mjs`
- Create: `tests/lib/report.mjs`
- Create: `tests/smoke.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `browser.mjs` → `chromiumPath(): string`, `launch(): Promise<Browser>`
  - `server.mjs` → `startPreview({ port?: number }): Promise<{ base: string, stop: () => void }>`
  - `pages.mjs` → `pageUrls(): string[]` (e.g. `['/404.html', '/about.html', '/index.html', …]`)
  - `report.mjs` → `ok(cond: boolean, label: string, detail?: string): void`, `section(name: string): void`, `finish(name: string): never | void`

- [ ] **Step 1: Install the two devDependencies**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
cd /Users/ryanalmasi/Documents/GitHub/mz-design-consulting-ltd
npm install --save-dev playwright-core axe-core
```

Expected: both land in `devDependencies`. `playwright-core` ships **no browser binary** — that is the point; the Chromium already cached on this machine is reused.

- [ ] **Step 2: Write the Chromium locator**

Create `tests/lib/browser.mjs`:

```js
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

// playwright-core deliberately ships no browser. This machine already has one
// cached from a previous Playwright install; reusing it keeps the devDependency
// small and avoids a 150 MB download on every clone.
const CACHE = join(homedir(), 'Library/Caches/ms-playwright');
const REL = 'chrome-mac/Chromium.app/Contents/MacOS/Chromium';

export function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;

  let dirs = [];
  try {
    dirs = readdirSync(CACHE).filter((d) => d.startsWith('chromium-')).sort().reverse();
  } catch {
    throw new Error(
      `No Playwright browser cache at ${CACHE}.\n` +
        'Set CHROMIUM_PATH to a Chromium binary, or run: npx playwright install chromium'
    );
  }

  for (const dir of dirs) {
    const candidate = join(CACHE, dir, REL);
    if (existsSync(candidate)) return candidate;
  }

  throw new Error(
    `Found ${dirs.length} cached Playwright dir(s) under ${CACHE} but no Chromium binary.\n` +
      'Set CHROMIUM_PATH, or run: npx playwright install chromium'
  );
}

export function launch() {
  return chromium.launch({ executablePath: chromiumPath() });
}
```

- [ ] **Step 3: Write the preview-server helper**

Create `tests/lib/server.mjs`:

```js
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

/**
 * Serves an existing `dist/` with `astro preview`. It does NOT build — the
 * caller builds once, then every script reuses the same output, so a sweep
 * cannot accidentally test a stale or half-written directory.
 */
export async function startPreview({ port = 4321 } = {}) {
  const proc = spawn('npx', ['astro', 'preview', '--port', String(port)], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  let stderr = '';
  proc.stderr.on('data', (d) => (stderr += d.toString()));

  const base = `http://localhost:${port}`;
  const deadline = Date.now() + 30_000;

  for (;;) {
    try {
      const res = await fetch(`${base}/index.html`);
      if (res.ok) break;
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) {
      proc.kill('SIGKILL');
      throw new Error(`astro preview did not start within 30s.\n${stderr}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  return { base, stop: () => proc.kill('SIGTERM') };
}
```

- [ ] **Step 4: Write the page enumerator**

Create `tests/lib/pages.mjs`:

```js
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../../dist/', import.meta.url));

/**
 * Every built page, requested by its real filename.
 *
 * `build.format: 'file'` means the homepage is /index.html and services is
 * /services.html. Requesting the file directly sidesteps the whole
 * extensionless-vs-.html question (gotcha #1) — that normalisation is the
 * site's job, not the harness's.
 *
 * Derived from dist/ rather than hard-coded, so a new project or article
 * enters the sweep the moment it builds.
 */
export function pageUrls() {
  const out = [];

  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.html')) out.push('/' + relative(DIST, full).split(sep).join('/'));
    }
  };

  walk(DIST);
  return out.sort();
}
```

- [ ] **Step 5: Write the reporter**

Create `tests/lib/report.mjs`:

```js
let checks = 0;
let failures = 0;

export function section(name) {
  console.log(`\n── ${name}`);
}

export function ok(cond, label, detail = '') {
  checks += 1;
  if (cond) return;
  failures += 1;
  console.error(`  ✗ ${label}${detail ? `\n      ${detail}` : ''}`);
}

export function finish(name) {
  console.log(`\n${name}: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) {
    console.error(`${name}: ${failures} FAILURE(S)`);
    process.exit(1);
  }
}
```

- [ ] **Step 6: Write the smoke test**

Create `tests/smoke.mjs`. This is the failing test for this task — it proves the three helpers compose before any real check depends on them.

```js
import { launch } from './lib/browser.mjs';
import { startPreview } from './lib/server.mjs';
import { pageUrls } from './lib/pages.mjs';
import { ok, section, finish } from './lib/report.mjs';

const { base, stop } = await startPreview();
const browser = await launch();

try {
  section('harness');
  const urls = pageUrls();
  ok(urls.length >= 20, 'dist/ contains at least 20 pages', `found ${urls.length}`);
  ok(urls.includes('/index.html'), 'homepage present in the page list');

  const page = await browser.newPage();
  const res = await page.goto(`${base}/index.html`, { waitUntil: 'load' });
  ok(res?.status() === 200, 'preview serves the homepage', `status ${res?.status()}`);

  const title = await page.title();
  ok(title.includes('M&Z'), 'homepage title rendered', title);
} finally {
  await browser.close();
  stop();
}

finish('smoke');
```

- [ ] **Step 7: Add the npm scripts**

In `package.json`, replace the `"scripts"` block with:

```json
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "dev:full": "npm run build && wrangler pages dev dist --port 8788",
    "check": "astro check",
    "verify": "astro check && astro build",
    "deploy": "npm run build && wrangler pages deploy dist",
    "test:smoke": "node tests/smoke.mjs",
    "test:axe": "node tests/axe.mjs",
    "test:layout": "node tests/layout.mjs",
    "test:contrast": "node tests/contrast.mjs",
    "test:interaction": "node tests/interaction.mjs",
    "test:motion": "node tests/motion.mjs",
    "test": "npm run build && npm run test:axe && npm run test:layout && npm run test:contrast && npm run test:interaction && npm run test:motion"
  },
```

Scripts for files that do not exist yet are fine — they are added in tasks 2–5 and `npm test` is not run until task 6.

- [ ] **Step 8: Run the smoke test and verify it passes**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
cd /Users/ryanalmasi/Documents/GitHub/mz-design-consulting-ltd
npm run build && npm run test:smoke
```

Expected: `smoke: 4/4 checks passed`, exit 0.

If it hangs on startup, the most likely cause is a stale process on 4321 — `lsof -ti:4321 | xargs kill` and retry.

- [ ] **Step 9: Confirm the harness did not disturb the build**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run verify
```

Expected: `0 errors, 0 warnings, 0 hints`, 22 pages.

This matters more than it looks: `tsconfig.json` includes `**/*.ts`, `**/*.tsx`, `**/*.astro` — **not** `.mjs`. The test files are `.mjs` deliberately so `astro check` ignores them and the 0/0/0 bar is unaffected. If a future file under `tests/` is written as `.ts`, it enters the type check and must satisfy `astro/tsconfigs/strict`.

- [ ] **Step 10: Commit**

```bash
cd /Users/ryanalmasi/Documents/GitHub/mz-design-consulting-ltd
git add package.json package-lock.json tests/
git commit -m "$(cat <<'EOF'
test: add the browser verification harness foundation

playwright-core + axe-core as devDependencies, driving the Chromium already
cached on this machine. Three sessions have now written throwaway verification
scripts in temp directories; this makes them persistent and unblocks CI.

Test files are .mjs so astro check (which includes only .ts/.tsx/.astro) does
not type-check them and the 0/0/0 bar is unaffected.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Accessibility sweep

**Files:**
- Create: `tests/axe.mjs`
- Create: `tests/baseline.json`

**Interfaces:**
- Consumes: `launch()`, `startPreview()`, `pageUrls()`, `ok()/section()/finish()`.
- Produces: `tests/baseline.json` with shape `{ "axe": { "colorContrastIncomplete": number }, "js": { "bytes": number } }`. Task 3 adds the `js.bytes` value; this task writes the file with both keys, using `0` for `js.bytes` as a starting value that task 3 replaces with the measured one.

**Why themes are driven by `colorScheme`, not `data-theme`:** `tokens.css` supports both (`@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }` and `:root[data-theme='dark']`), but the site ships no theme toggle, so `prefers-color-scheme` is the only path a real visitor takes. Playwright's `newContext({ colorScheme })` drives exactly that, with no injected script to go wrong.

- [ ] **Step 1: Write the sweep**

Create `tests/axe.mjs`:

```js
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
```

- [ ] **Step 2: Seed the baseline permissively, then run to measure**

Create `tests/baseline.json`:

```json
{
  "axe": {
    "colorContrastIncomplete": 100000
  },
  "js": {
    "bytes": 0
  }
}
```

Run:

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
cd /Users/ryanalmasi/Documents/GitHub/mz-design-consulting-ltd
npm run build && npm run test:axe
```

Expected: **0 violations** on every page (`MEMORY.md` session 1 recorded 0 for the same sweep), and a printed `(measured N undetermined-contrast nodes …)` line.

If any violation appears, stop and report it — the site regressed between session 1 and now, and that is a finding, not a harness bug. Do not adjust the site in Pass A without raising it first.

- [ ] **Step 3: Write the measured number into the baseline**

Replace `100000` in `tests/baseline.json` with the exact `N` printed in step 2.

- [ ] **Step 4: Re-run and verify it passes on the real number**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run test:axe
```

Expected: all checks pass, including `colour-contrast "incomplete" nodes did not increase`.

- [ ] **Step 5: Commit**

```bash
git add tests/axe.mjs tests/baseline.json
git commit -m "$(cat <<'EOF'
test: add the axe-core sweep and record its baseline

22 pages x {1440x900, 390x844} x {light, dark} against wcag2a, wcag2aa,
wcag21a, wcag21aa, wcag22aa and best-practice.

Also counts colour-contrast "incomplete" nodes — contrast axe could not
determine, usually text over an image — and holds that count to a committed
baseline. That is where a new decorative ground would hide a contrast failure.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Layout, console and payload sweep

**Files:**
- Create: `tests/layout.mjs`
- Modify: `tests/baseline.json` (the `js.bytes` value)

**Interfaces:**
- Consumes: `launch()`, `startPreview()`, `pageUrls()`, reporter.
- Produces: nothing other tasks import. Task 14 relies on `js.bytes` still being enforced.

- [ ] **Step 1: Write the sweep**

Create `tests/layout.mjs`:

```js
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
  baseline.js.bytes === 0 || jsBytes <= baseline.js.bytes,
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
```

- [ ] **Step 2: Run it to measure the payload and confirm the layout is clean**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
cd /Users/ryanalmasi/Documents/GitHub/mz-design-consulting-ltd
npm run build && npm run test:layout
```

Expected: every check passes (the `js.bytes: 0` baseline short-circuits the payload assertion on this first run), and a printed `shipped JS: N bytes` line. `N` should be roughly 2000 — `MEMORY.md` records "Total JS ~2 KB".

- [ ] **Step 3: Record the measured payload**

Set `js.bytes` in `tests/baseline.json` to the measured `N`. Leave `axe.colorContrastIncomplete` as task 2 set it.

- [ ] **Step 4: Re-run and verify the payload assertion is now live**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run test:layout
```

Expected: `shipped JavaScript did not grow` passes against the real number.

- [ ] **Step 5: Commit**

```bash
git add tests/layout.mjs tests/baseline.json
git commit -m "$(cat <<'EOF'
test: add the layout, console and JS-payload sweep

Horizontal overflow (naming the first offending element), console and page
errors, and total shipped JavaScript held to a committed baseline so the
CSS-only constraint on the visual pass is enforced rather than remembered.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Contrast probe

**Files:**
- Create: `tests/lib/color.mjs`
- Create: `tests/contrast.mjs`

**Interfaces:**
- Consumes: `launch()`, `startPreview()`, reporter.
- Produces:
  - `color.mjs` → `parseColor(css: string): {r,g,b,a}`, `composite(fg, bg): {r,g,b,a}`, `luminance({r,g,b}): number`, `contrast(a, b): number`
  - `contrast.mjs` → a `PAIRS` array that task 8 extends with the grid-wash case.

**Why analytic and not pixel-sampling:** the question spec §5 asks ("does body text clear 4.5:1 against the *darkest* point of the grid wash?") is not answerable by reading one pixel — the darkest point is where two 50%-alpha grid lines cross, which may be a single-pixel intersection. Compositing the layers arithmetically from the live computed token values answers it exactly, and it stays true when a token changes.

- [ ] **Step 1: Write the colour maths**

Create `tests/lib/color.mjs`:

```js
/** Parses the `rgb()` / `rgba()` form that getComputedStyle always returns. */
export function parseColor(css) {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) throw new Error(`Unparseable colour: ${css}`);
  const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  const [r, g, b, a = 1] = parts;
  return { r, g, b, a };
}

/** Source-over composite of a possibly-translucent fg onto an opaque bg. */
export function composite(fg, bg) {
  const a = fg.a ?? 1;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

/** WCAG 2.x relative luminance. */
export function luminance({ r, g, b }) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
```

- [ ] **Step 2: Write the probe**

Create `tests/contrast.mjs`:

```js
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
```

- [ ] **Step 3: Run it**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
cd /Users/ryanalmasi/Documents/GitHub/mz-design-consulting-ltd
npm run build && npm run test:contrast
```

Expected: `contrast: 22/22 checks passed`. The ratios should broadly match the comments in `tokens.css` — muted text on vellum ≈ 6.0:1, white on `--cut` ≈ 5.2:1, `--cut-light` on ink ≈ 5.7:1.

If a pair fails, report it rather than adjusting a token: `tokens.css` documents these ratios and a mismatch means either the probe is wrong or a documented ratio is stale. Both are findings.

- [ ] **Step 4: Commit**

```bash
git add tests/lib/color.mjs tests/contrast.mjs
git commit -m "$(cat <<'EOF'
test: add an analytic contrast probe over the token pairs

Resolves var()/color-mix() through the browser, composites any translucent
layers onto the ground, then takes the WCAG ratio. Analytic rather than
pixel-sampled because the question the stylization spec asks — body text
against the DARKEST point of a grid wash, where two 50% lines cross — is not
answerable by reading one pixel.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Interaction suite

**Files:**
- Create: `tests/interaction.mjs`

**Interfaces:**
- Consumes: `launch()`, `startPreview()`, reporter.
- Produces: nothing other tasks import. Task 10 adds a duotone keyboard-parity block to this file.

- [ ] **Step 1: Write the suite**

Create `tests/interaction.mjs`. Selectors below are taken from the current markup: `.filter[data-filter]`, `#filter-status`, `#project-grid`, `.project-card[data-category]`, `#nav-toggle`, `#nav-drawer`, `#faq details.faq`.

```js
import { launch } from './lib/browser.mjs';
import { startPreview } from './lib/server.mjs';
import { ok, section, finish } from './lib/report.mjs';

const { base, stop } = await startPreview();
const browser = await launch();

try {
  // ---- Project filter -----------------------------------------------------
  section('project filter');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${base}/projects.html`, { waitUntil: 'load' });

    const total = await page.locator('.project-card').count();
    ok(total >= 9, 'all projects render', `found ${total}`);

    // Counts on the chips must equal what filtering actually shows.
    const sectors = await page.$$eval('.filter:not([data-filter="all"])', (els) =>
      els.map((el) => ({
        name: el.dataset.filter,
        count: Number(el.querySelector('.filter-count').textContent.trim()),
      }))
    );
    ok(sectors.length >= 2, 'more than one sector offered', `found ${sectors.length}`);

    for (const sector of sectors) {
      await page.click(`.filter[data-filter="${sector.name}"]`);
      const visible = await page.locator('.project-card:not(.is-hidden)').count();
      ok(visible === sector.count, `"${sector.name}" shows its advertised count`, `chip says ${sector.count}, grid shows ${visible}`);

      const pressed = await page.getAttribute(`.filter[data-filter="${sector.name}"]`, 'aria-pressed');
      ok(pressed === 'true', `"${sector.name}" is aria-pressed`, `got ${pressed}`);

      const othersPressed = await page.$$eval(
        '.filter',
        (els, active) => els.filter((e) => e.dataset.filter !== active && e.getAttribute('aria-pressed') === 'true').length,
        sector.name
      );
      ok(othersPressed === 0, `"${sector.name}" is the only pressed chip`, `${othersPressed} others pressed`);

      const status = (await page.textContent('#filter-status'))?.trim();
      ok(
        status?.includes(String(sector.count)),
        `live region announces the "${sector.name}" result`,
        status
      );

      const url = new URL(page.url());
      ok(url.searchParams.get('sector') === sector.name, `URL syncs for "${sector.name}"`, page.url());
    }

    // Deep link: load straight into a filtered state.
    const deep = sectors[0];
    await page.goto(`${base}/projects.html?sector=${encodeURIComponent(deep.name)}`, { waitUntil: 'load' });
    const deepVisible = await page.locator('.project-card:not(.is-hidden)').count();
    ok(deepVisible === deep.count, `deep link applies the "${deep.name}" filter`, `showed ${deepVisible} of ${deep.count}`);

    // Back to all.
    await page.click('.filter[data-filter="all"]');
    const allVisible = await page.locator('.project-card:not(.is-hidden)').count();
    ok(allVisible === total, '"All" restores every card', `${allVisible} of ${total}`);
    ok(!new URL(page.url()).searchParams.has('sector'), '"All" clears the URL parameter', page.url());

    await ctx.close();
  }

  // ---- Mobile drawer ------------------------------------------------------
  section('mobile drawer');
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'load' });

    ok(!(await page.isVisible('#nav-drawer')), 'drawer starts closed');
    ok((await page.getAttribute('#nav-toggle', 'aria-expanded')) === 'false', 'toggle starts aria-expanded=false');

    await page.click('#nav-toggle');
    ok(await page.isVisible('#nav-drawer'), 'drawer opens on click');
    ok((await page.getAttribute('#nav-toggle', 'aria-expanded')) === 'true', 'toggle reports expanded');

    await page.keyboard.press('Escape');
    ok(!(await page.isVisible('#nav-drawer')), 'Escape closes the drawer');
    const focused = await page.evaluate(() => document.activeElement?.id);
    ok(focused === 'nav-toggle', 'focus returns to the toggle', `activeElement is #${focused}`);

    await ctx.close();
  }

  // ---- FAQ ----------------------------------------------------------------
  section('faq');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${base}/insights.html`, { waitUntil: 'load' });

    const count = await page.locator('#faq details.faq').count();
    ok(count >= 5, 'FAQ entries render', `found ${count}`);

    const first = page.locator('#faq details.faq').first();
    ok(!(await first.evaluate((el) => el.open)), 'first FAQ starts closed');

    // Keyboard operation: focus the summary and press Enter.
    await first.locator('summary').focus();
    await page.keyboard.press('Enter');
    ok(await first.evaluate((el) => el.open), 'Enter opens the FAQ from the keyboard');
    await page.keyboard.press('Enter');
    ok(!(await first.evaluate((el) => el.open)), 'Enter closes it again');

    await ctx.close();
  }
} finally {
  await browser.close();
  stop();
}

finish('interaction');
```

- [ ] **Step 2: Run it**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
cd /Users/ryanalmasi/Documents/GitHub/mz-design-consulting-ltd
npm run build && npm run test:interaction
```

Expected: every check passes. `MEMORY.md` session 1 recorded 16 interaction assertions passing over the same behaviour.

- [ ] **Step 3: Commit**

```bash
git add tests/interaction.mjs
git commit -m "$(cat <<'EOF'
test: add the interaction suite

Project filter counts, aria-pressed exclusivity, live-region announcement, URL
sync and deep-linking; mobile drawer open, Escape-close and focus return; FAQ
keyboard operation.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Motion guards, docs, and the green baseline

**Files:**
- Create: `tests/motion.mjs`
- Create: `tests/README.md`
- Modify: `CLAUDE.md` (verification section)

**Interfaces:**
- Consumes: `launch()`, `startPreview()`, `pageUrls()`, reporter.
- Produces: `tests/motion.mjs` exports nothing; task 11 extends its `REVEAL_PAGES` list.

`tests/motion.mjs` is written now, in Pass A, and passes trivially because no `.reveal` element exists yet. That is deliberate: task 11 then has a test that already runs, and the only thing that changes is that it starts having something to assert about.

- [ ] **Step 1: Write the motion guard**

Create `tests/motion.mjs`:

```js
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
```

- [ ] **Step 2: Run the whole suite end to end**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
cd /Users/ryanalmasi/Documents/GitHub/mz-design-consulting-ltd
npm test
```

Expected: build succeeds, then `axe`, `layout`, `contrast`, `interaction` and `motion` all exit 0. `motion` reports `(0 .reveal element(s) found across the site)` — correct for Pass A.

- [ ] **Step 3: Write the test README**

Create `tests/README.md`:

```markdown
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
```

- [ ] **Step 4: Point `CLAUDE.md` at the harness**

In `CLAUDE.md`, replace this paragraph at the end of the "Verification expectations" section:

```markdown
Chromium for this is already cached at
`~/Library/Caches/ms-playwright/chromium-*/chrome-mac/Chromium.app/Contents/MacOS/Chromium`
and can be driven with `playwright-core` pointed at that `executablePath`. The
scripts used last session lived in a temp directory and no longer exist; see the
note in `MEMORY.md` about optionally adding them under `tests/`.
```

with:

```markdown
All six are automated. Run `npm test` — it builds, then runs the axe sweep,
the layout/console/payload sweep, the contrast probe, the interaction suite and
the motion guards. See [`tests/README.md`](tests/README.md) for what each one
covers and for the two numbers in `tests/baseline.json` that must not go up.

The harness drives the Chromium already cached at
`~/Library/Caches/ms-playwright/chromium-*/chrome-mac/Chromium.app/Contents/MacOS/Chromium`
through `playwright-core`; override the location with `CHROMIUM_PATH`.

Item 5 (the contact API under `wrangler pages dev`) is **not** in the harness —
it needs a Wrangler process and Resend credentials. Exercise it by hand per
`docs/DEPLOYMENT.md` when the Function or the form changes.
```

- [ ] **Step 5: Run the full suite once more, then verify**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm test && npm run verify
```

Expected: every suite exits 0; `verify` reports 0 errors, 0 warnings, 0 hints.

**This is the green baseline. Pass B starts from here.** Record the exact numbers each suite printed — they go in the `MEMORY.md` entry in task 15.

- [ ] **Step 6: Commit**

```bash
git add tests/ CLAUDE.md
git commit -m "$(cat <<'EOF'
test: add motion guards, the test README, and wire CLAUDE.md to the harness

The motion guards pass trivially today (no .reveal elements exist yet) and are
written now so the visual pass inherits a running test rather than writing one
alongside the change it is meant to police.

Pass A complete: the harness is green against the current UI.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

# PASS B — the visual work

Every task from here follows the same shape: **add the assertion, watch it fail, implement, watch it pass, commit.** The suite from Pass A is the safety net; if a task breaks a check that has nothing to do with it, stop and investigate rather than adjusting the baseline.

---

### Task 7: Display type scale

**Files:**
- Modify: `src/styles/tokens.css` (after the `--t-3xl` line, ~line 74)
- Modify: `src/styles/global.css:95-103`
- Create: `tests/visual.mjs`
- Modify: `package.json` (one script)

**Interfaces:**
- Consumes: reporter, `launch()`, `startPreview()`.
- Produces: `tests/visual.mjs` — tasks 8, 10, 13 and 14 each append a `section()` block to it.

Spec §4. The `clamp()` **floor does not move**; only the ceiling grows. Raising the floor is the most likely way to reintroduce overflow at 390px.

- [ ] **Step 1: Write the failing test**

Create `tests/visual.mjs`:

```js
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
```

Add to `package.json` scripts, after `"test:motion"`:

```json
    "test:visual": "node tests/visual.mjs",
```

and extend the `"test"` script so it ends `… && npm run test:motion && npm run test:visual`.

- [ ] **Step 2: Run it and watch it fail**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
cd /Users/ryanalmasi/Documents/GitHub/mz-design-consulting-ltd
npm run build && npm run test:visual
```

Expected: FAIL on `h1 reaches the new ceiling at 1440px` (currently 68px, the old `4.25rem` cap) and on `h1 uses the display weight` (currently 700). The floor and `h3` checks should already pass — that is the point of including them.

- [ ] **Step 3: Add the tokens**

In `src/styles/tokens.css`, immediately after the `--t-3xl: 3rem;` line:

```css
  --t-4xl: 3.75rem;    /* 60px */
  --t-5xl: 4.75rem;    /* 76px */

  /* Archivo is loaded as a variable font. The site used one weight (700) for
     every heading; opening the axis at the top of the scale is what makes the
     display sizes read as display type rather than as large body headings. */
  --wt-display: 800;   /* h1, h2 */
  --wt-heading: 700;   /* h3, h4 — unchanged */
```

- [ ] **Step 4: Apply the scale**

In `src/styles/global.css`, replace lines 95–103:

```css
h1 {
  font-size: clamp(2.5rem, 6.5vw, 4.25rem);
  letter-spacing: -0.035em;
}

h2 {
  font-size: clamp(1.875rem, 4vw, var(--t-3xl));
  letter-spacing: -0.03em;
}
```

with:

```css
/*
 * The clamp() MINIMUM does not move on either of these. Only the ceiling
 * grows: the editorial effect is wanted on desktop, where there is room for
 * it, and raising the floor is the most reliable way to reintroduce
 * horizontal overflow at 390px.
 */
h1 {
  font-size: clamp(2.5rem, 7.5vw, var(--t-5xl));
  font-weight: var(--wt-display);
  letter-spacing: -0.04em;
}

h2 {
  font-size: clamp(1.875rem, 4.5vw, 3.5rem);
  font-weight: var(--wt-display);
  letter-spacing: -0.032em;
}
```

`h3` and `h4` keep the `font-weight: 700` they inherit from the shared `h1, h2, h3, h4` rule above — leave that rule alone.

- [ ] **Step 5: Run the visual test and verify it passes**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run build && npm run test:visual
```

Expected: `visual: 6/6 checks passed`.

- [ ] **Step 6: Run the overflow and accessibility sweeps**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run test:layout && npm run test:axe
```

Expected: both pass. `layout` is the one that catches a 390px overflow from a heading that no longer fits; `axe` catches a heading that got too large for its container and clipped.

- [ ] **Step 7: Commit**

```bash
git add src/styles/tokens.css src/styles/global.css tests/visual.mjs package.json
git commit -m "$(cat <<'EOF'
feat: open the display type scale at the top end

h1 ceiling 4.25rem -> 4.75rem, h2 3rem -> 3.5rem, both at weight 800 on the
Archivo variable axis the site was not using. Both clamp() FLOORS are
unchanged; tests/visual.mjs asserts the 390px sizes explicitly so a later
edit cannot quietly raise them.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Depth layer — the drawing devices

**Files:**
- Modify: `src/styles/tokens.css` (new tokens, both themes)
- Modify: `src/styles/global.css` (new utilities in the "Drawing-sheet devices" section, after `.rule-strong`, ~line 247)
- Modify: `tests/contrast.mjs` (grid-wash pair)
- Modify: `tests/visual.mjs` (device assertions)

**Interfaces:**
- Consumes: the type tokens from task 7.
- Produces: the classes `.sheet-grid`, `.hatch-cut`, `.hatch-fill`, `.reg-marks`, `.chainage`, `.match-line`, consumed by tasks 9 and 14.

Spec §5. Every device is decorative: implemented as a pseudo-element or on an element carrying `aria-hidden="true"`, so none reaches the accessibility tree.

- [ ] **Step 1: Write the failing contrast assertion**

In `tests/contrast.mjs`, add to the end of the `PAIRS` array:

```js
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
```

- [ ] **Step 2: Write the failing device assertions**

In `tests/visual.mjs`, insert this block after the `type scale` section and before the `finally`:

```js
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

    // Every device instance must be out of the accessibility tree: either a
    // pseudo-element (nothing in the DOM) or explicitly aria-hidden.
    const leaked = await page.$$eval(
      '.sheet-grid, .hatch-cut, .hatch-fill, .reg-marks, .chainage, .match-line',
      (els) =>
        els
          .filter((el) => {
            // A device carrying real content is fine; a device that IS the
            // content must be hidden from assistive technology.
            const decorativeOnly = el.dataset.decorative === 'true';
            return decorativeOnly && el.getAttribute('aria-hidden') !== 'true';
          })
          .map((el) => `${el.tagName.toLowerCase()}.${el.className}`)
    );
    ok(leaked.length === 0, 'purely decorative devices are aria-hidden', leaked.join(', '));

    await ctx.close();
  }
```

- [ ] **Step 3: Run both and watch them fail**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
cd /Users/ryanalmasi/Documents/GitHub/mz-design-consulting-ltd
npm run build && npm run test:visual; npm run test:contrast
```

Expected: `visual` FAILS on the three token checks (`(unset)`), and `contrast` FAILS with `Unparseable colour` for `var(--grid-line)` — an undefined custom property resolves to nothing, which the probe reports as unparseable. Both are the right failures.

- [ ] **Step 4: Add the tokens**

In `src/styles/tokens.css`, inside `:root`, after the `--border-strong` line:

```css
  /* ---- Depth layer ------------------------------------------------- */
  /* Drawing devices: a drafting grid, section hatching, registration ticks.
     All decorative, all built from the existing linework colours rather than
     new hues, so the depth reads as more drawing rather than more interface. */
  --grid-size: 32px;
  --grid-line: color-mix(in srgb, var(--line) 50%, transparent);
  --hatch-gap: 7px;
  --hatch-cut-ink: color-mix(in srgb, var(--cut) 18%, transparent);
  --hatch-fill-ink: color-mix(in srgb, var(--fill) 18%, transparent);
```

These sit in `:root` and inherit into both themes automatically, because each one is defined in terms of `--line`, `--cut` and `--fill`, which the dark blocks already redefine. **Do not duplicate them into the two dark blocks** — that would freeze them at the light values.

Exception: the hatch inks are keyed to `--cut`/`--fill`, which are *not* redefined in dark mode (only `--accent` switches to `--cut-light`). On the dark grounds the 18% mix reads too dark, so add to **both** dark blocks — the `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }` block and the `:root[data-theme='dark']` block — immediately after their `--line-invert` line:

```css
    --hatch-cut-ink: color-mix(in srgb, var(--cut-light) 16%, transparent);
    --hatch-fill-ink: color-mix(in srgb, var(--fill-light) 16%, transparent);
```

- [ ] **Step 5: Add the utility classes**

In `src/styles/global.css`, in the "Drawing-sheet devices" section, after the `.rule-strong` rule (line 247) and before the `.data` comment block:

```css
/*
 * Depth layer. Everything below is decorative: it is either a pseudo-element,
 * or an element the page marks aria-hidden. None of it carries meaning and
 * none of it may be the only way something is communicated.
 */

/* A drafting grid, laid behind content as a wash. Sized so it reads as ruling
   at arm's length and disappears at reading distance. */
.sheet-grid {
  position: relative;
  isolation: isolate;
}

.sheet-grid::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image:
    repeating-linear-gradient(
      to right,
      var(--grid-line) 0 1px,
      transparent 1px var(--grid-size)
    ),
    repeating-linear-gradient(
      to bottom,
      var(--grid-line) 0 1px,
      transparent 1px var(--grid-size)
    );
  /* Fades out before the band edge so the grid reads as a drawing area rather
     than as a table. */
  mask-image: linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent);
}

/* 45° section hatching, in the two directions a real section uses: cut leans
   one way, fill the other. */
.hatch-cut,
.hatch-fill {
  background-repeat: repeat;
}

.hatch-cut {
  background-image: repeating-linear-gradient(
    45deg,
    var(--hatch-cut-ink) 0 1px,
    transparent 1px var(--hatch-gap)
  );
}

.hatch-fill {
  background-image: repeating-linear-gradient(
    -45deg,
    var(--hatch-fill-ink) 0 1px,
    transparent 1px var(--hatch-gap)
  );
}

/* Registration marks: the L-shaped corner ticks a drawing sheet carries for
   alignment. Two pseudo-elements, four corners, via corner-anchored gradients. */
.reg-marks {
  position: relative;
}

.reg-marks::before,
.reg-marks::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  pointer-events: none;
  border-color: var(--line-strong);
  border-style: solid;
  transition: border-color var(--dur) var(--ease);
}

.reg-marks::before {
  top: -1px;
  left: -1px;
  border-width: 1px 0 0 1px;
}

.reg-marks::after {
  right: -1px;
  bottom: -1px;
  border-width: 0 1px 1px 0;
}

/*
 * A chainage rule: tick geometry only.
 *
 * The obvious version of this device prints station values (0+000, 0+100)
 * along the rule. It must not. Monospace here is reserved for real measured
 * values, and invented chainages on a marketing page are decorative labels
 * wearing the costume of survey data — a bad look specifically for an
 * engineering firm. If a real measured value is ever available for a given
 * rule, it may carry that.
 */
.chainage {
  height: 12px;
  border: 0;
  margin: 0;
  background-image:
    linear-gradient(to bottom, var(--line-strong) 0 1px, transparent 1px),
    repeating-linear-gradient(
      to right,
      var(--line-strong) 0 1px,
      transparent 1px var(--grid-size)
    );
  background-size: 100% 1px, 100% 6px;
  background-position: 0 0, 0 0;
  background-repeat: no-repeat, repeat-x;
}

/* A match line: where one drawing sheet continues onto the next. */
.match-line {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  border: 0;
  margin: 0;
  color: var(--muted-ink, var(--text-muted));
}

.match-line::before,
.match-line::after {
  content: '';
  flex: 1;
  height: 0;
  border-top: 1px dashed var(--line-strong);
}
```

- [ ] **Step 6: Run the contrast probe and verify it passes**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run build && npm run test:contrast
```

Expected: all 26 checks pass in both themes. The two new grid-wash pairs should measure comfortably above 4.5:1 — the wash is `--line` at 50%, which is a near-neighbour of `--bg-inset` in both themes.

If either fails, lower the `50%` in `--grid-line` rather than changing `--line` or `--bg-inset`; those are load-bearing elsewhere.

- [ ] **Step 7: Run the device assertions and verify they pass**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run test:visual
```

Expected: `visual: 10/10 checks passed`. The `leaked` check passes vacuously — no device is placed on a page yet. Task 9 puts that to work.

- [ ] **Step 8: Commit**

```bash
git add src/styles/tokens.css src/styles/global.css tests/contrast.mjs tests/visual.mjs
git commit -m "$(cat <<'EOF'
feat: add the drawing-device depth layer

.sheet-grid, .hatch-cut/.hatch-fill, .reg-marks, .chainage and .match-line, all
built from the existing linework tokens so the depth reads as more drawing
rather than as more interface.

.chainage carries tick geometry and NO numerals: monospace here is reserved for
real measured values, and invented station numbers are decorative labels in
survey costume.

The contrast probe now measures body and muted text against the grid wash at
its darkest point — two crossing 50% lines — not its average.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Place the devices on the pages

**Files:**
- Modify: `src/pages/index.astro` (sections at lines 135 and 186; new dividers)
- Modify: `src/pages/about.astro` (sections at lines 86 and 134)
- Modify: `src/pages/services.astro` (section at line 170)
- Modify: `src/pages/insights.astro` (section at line 93)
- Modify: `tests/visual.mjs`

**Interfaces:**
- Consumes: the classes from task 8.
- Produces: `.sheet-grid` / `.chainage` / `.match-line` instances that task 11's `.reveal` work and task 15's sweep both see.

**Placement rule:** `.sheet-grid` goes on `.band-inset` sections only. Not on `.band-ink` (the page-header diagram is already doing that job there) and not on plain `.section` (the grid needs a ground to sit against, and on the page colour it reads as a bug).

- [ ] **Step 1: Write the failing test**

In `tests/visual.mjs`, replace the `leaked` block inside the `drawing devices` section with the fuller version:

```js
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
```

- [ ] **Step 2: Run it and watch it fail**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run build && npm run test:visual
```

Expected: FAIL on `every inset band on the homepage carries the grid wash` (0 of 2), `carries a chainage rule` (0) and `carries a match line` (0).

- [ ] **Step 3: Place the devices on the homepage**

In `src/pages/index.astro`:

Line 135 — add the class:
```astro
  <section class="section band-inset sheet-grid">
```

Line 186 — same:
```astro
  <section class="section band-inset sheet-grid">
```

After the hero `</section>` (line 86) and before the credential strip, insert a chainage divider:
```astro
  <div class="container">
    <hr class="chainage" data-decorative="true" aria-hidden="true" />
  </div>
```

Inside the PROJECTS section (line 171), directly after `<div class="container">`, insert a match line that names the next view the way a drawing sheet does:
```astro
      <p class="match-line data-sm" data-decorative="true" aria-hidden="true">
        <span>SELECTED WORK</span>
      </p>
```

Note the `<hr>` for `.chainage` — an `<hr>` is a thematic break, which is what the device is, and `aria-hidden` keeps the purely visual instance out of the tree.

- [ ] **Step 4: Place the devices on the remaining pages**

`src/pages/about.astro` line 86 and line 134 — add `sheet-grid`:
```astro
  <section class="section band-inset sheet-grid">
```

`src/pages/services.astro` line 170 — add `sheet-grid`:
```astro
  <section class="section band-inset sheet-grid">
```

`src/pages/insights.astro` line 93 — add `sheet-grid`, keeping the id:
```astro
  <section class="section band-inset sheet-grid" id="faq">
```

`src/pages/insights/[...slug].astro` line 108 and `src/pages/projects/[...slug].astro` line 104 — add `sheet-grid` to the `section class="section band-inset"` on each.

- [ ] **Step 5: Run the visual test and verify it passes**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run build && npm run test:visual
```

Expected: all checks pass.

- [ ] **Step 6: Run the full suite**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm test
```

Expected: everything passes. The two checks most at risk here are `axe`'s `colorContrastIncomplete` baseline — a `background-image` on a band makes axe unable to determine contrast for text on it, which is exactly the number that baseline exists to police.

**If `colorContrastIncomplete` now exceeds the baseline:** that is expected and legitimate — the grid wash is a real background image. Confirm `npm run test:contrast` passes (which measures the same thing analytically, and more strictly), then re-measure the baseline as its own step:

```bash
npm run test:axe   # read the printed "(measured N …)" line
```

Write the new `N` into `tests/baseline.json` **in the same commit as this change**, with the reason in the commit message. Do not raise it silently and do not raise it to make an unrelated failure disappear.

- [ ] **Step 7: Commit**

```bash
git add src/pages tests/visual.mjs tests/baseline.json
git commit -m "$(cat <<'EOF'
feat: place the drawing devices on the pages

Grid wash on every inset band (not on ink bands — the page-header diagram
already does that job there); a chainage rule under the hero; a match line
opening the projects section.

Raises axe's colour-contrast "incomplete" baseline: a background-image on a
band legitimately makes axe unable to determine contrast for text over it.
tests/contrast.mjs measures the same pairs analytically and more strictly,
against the darkest point of the wash rather than its average.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Unified duotone imagery

**Files:**
- Modify: `src/styles/tokens.css` (the `--duotone-wash` token, all three theme blocks)
- Modify: `src/components/ProjectCard.astro:79-103`
- Modify: `src/components/ArticleCard.astro:83-93`
- Modify: `tests/interaction.mjs`
- Modify: `tests/visual.mjs`

**Interfaces:**
- Consumes: the tokens from task 8.
- Produces: nothing other tasks import.

Spec §6. This is the highest-leverage change available without new assets, and the one most likely to be a matter of taste — spec §12 records that it is isolated to a few rules and one token and can be dropped without touching anything else.

**Scope call, made here and worth knowing:** the duotone applies to the **card** media (`.pc-media`, `.ac-media`) only. The three large single images — the project detail hero, the article hero and the About intro — stay in full colour. The duotone's job is making a *grid* of seven mismatched stock photos read as one system; a single large image on its own page has no neighbours to clash with, and greying it out makes the one photograph of the work look like a placeholder. This is a reading of §6, not a contradiction of it. Look at both live before accepting it.

- [ ] **Step 1: Write the failing keyboard-parity test**

In `tests/interaction.mjs`, add a new block before the `finally`:

```js
  // ---- Duotone keyboard parity (spec §6, check 7) -------------------------
  section('duotone');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${base}/projects.html`, { waitUntil: 'load' });

    const img = page.locator('.project-card .pc-img').first();
    const resting = await img.evaluate((el) => getComputedStyle(el).filter);
    ok(resting !== 'none', 'card imagery is duotoned at rest', `filter: ${resting}`);

    // Keyboard users must get the same reveal as pointer users. Tab until the
    // first card's link has focus, then re-read the filter.
    await page.locator('.project-card .pc-link').first().focus();
    await page.waitForTimeout(600); // --dur-slow is 420ms
    const focused = await img.evaluate((el) => getComputedStyle(el).filter);
    ok(focused === 'none', 'focus-within returns the image to full colour', `filter: ${focused}`);

    // And the tint layer must come off too, not just the greyscale.
    const tintOpacity = await page
      .locator('.project-card')
      .first()
      .evaluate((el) => getComputedStyle(el.querySelector('.pc-media'), '::after').opacity);
    ok(Number(tintOpacity) < 0.01, 'the tint layer clears on focus', `opacity ${tintOpacity}`);

    // §13.3: the category chip is opaque, so the duotone underneath cannot
    // affect its contrast. Assert that it STAYS opaque rather than measuring
    // it over imagery.
    const chipAlpha = await page
      .locator('.pc-category')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    ok(!chipAlpha.startsWith('rgba') || chipAlpha.endsWith(', 1)'), 'the category chip is still opaque', chipAlpha);

    await ctx.close();
  }
```

- [ ] **Step 2: Run it and watch it fail**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run build && npm run test:interaction
```

Expected: FAIL on `card imagery is duotoned at rest` (`filter: none` today). The chip-opacity check should already pass.

- [ ] **Step 3: Add the duotone token**

In `src/styles/tokens.css`, in `:root`, after the depth-layer tokens from task 8:

```css
  /* Unifies seven mismatched stock photographs into one system. Pulls toward
     the existing blue-grey linework colour rather than introducing a new hue. */
  --duotone-wash: color-mix(in srgb, var(--datum) 55%, transparent);
```

And in **both** dark blocks, after the `--hatch-fill-ink` line added in task 8:

```css
    /* Weaker on a dark ground: the images already sit dark, and the light-mode
       strength reads as mud. */
    --duotone-wash: color-mix(in srgb, var(--datum) 40%, transparent);
```

- [ ] **Step 4: Apply it to the project card**

In `src/components/ProjectCard.astro`, replace the `.pc-media` and `.pc-img` rules (lines 79–90) with:

```css
  .pc-media {
    position: relative;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    background: var(--bg-inset);
  }

  /*
   * Graphite duotone, returning to full colour on hover and on focus-within.
   * The seven photographs carried over from the old site were shot by
   * different people in different light; desaturating them is what makes a
   * grid of them read as one set rather than as seven stock purchases.
   */
  .pc-media::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--duotone-wash);
    mix-blend-mode: color;
    pointer-events: none;
    transition: opacity var(--dur-slow) var(--ease);
  }

  .pc-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(1) contrast(1.08) brightness(0.96);
    transition: filter var(--dur-slow) var(--ease);
  }

  /* :focus-within, not only :hover — keyboard users get the same reveal. */
  .project-card:hover .pc-img,
  .project-card:focus-within .pc-img {
    filter: none;
  }

  .project-card:hover .pc-media::after,
  .project-card:focus-within .pc-media::after {
    opacity: 0;
  }
```

- [ ] **Step 5: Apply it to the article card**

In `src/components/ArticleCard.astro`, replace the `.ac-media` and `.ac-img` rules (lines 83–93) with:

```css
  .ac-media {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: var(--bg-inset);
  }

  .ac-media::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--duotone-wash);
    mix-blend-mode: color;
    pointer-events: none;
    transition: opacity var(--dur-slow) var(--ease);
  }

  .ac-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(1) contrast(1.08) brightness(0.96);
    transition: filter var(--dur-slow) var(--ease);
  }

  .article-card:hover .ac-img,
  .article-card:focus-within .ac-img {
    filter: none;
  }

  .article-card:hover .ac-media::after,
  .article-card:focus-within .ac-media::after {
    opacity: 0;
  }
```

`.ac-media` had no `position` before; `::after` with `inset: 0` needs it. Missing it is silent — the tint escapes to the nearest positioned ancestor and covers the card.

- [ ] **Step 6: Run the interaction test and verify it passes**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run build && npm run test:interaction
```

Expected: all checks pass, including the four new duotone ones.

- [ ] **Step 7: Look at it live, in both themes**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run preview
```

Open `/projects.html` and `/insights.html`. Check the grid at rest, on hover, and on tab-through, in light and dark. **This is the taste call in spec §12** — if the duotone is disliked, it comes out by reverting this one task and nothing else in the plan depends on it.

- [ ] **Step 8: Run the full suite**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm test
```

Expected: everything passes. Watch `axe` — a `mix-blend-mode` layer over imagery can move the `colorContrastIncomplete` count. If it does, apply the same re-measure procedure as task 9 step 6.

- [ ] **Step 9: Commit**

```bash
git add src/styles/tokens.css src/components/ProjectCard.astro src/components/ArticleCard.astro tests/interaction.mjs
git commit -m "$(cat <<'EOF'
feat: unify the card imagery with a graphite duotone

Greyscale plus a --datum-keyed tint on project and article card media,
returning to full colour on hover AND focus-within so keyboard users get the
same reveal. Weaker tint in dark mode, where the light-mode strength reads as
mud.

Card media only. The three large single images — project hero, article hero,
About intro — stay in colour: the duotone's job is making a GRID of seven
mismatched stock photos read as one set, and a lone large image has no
neighbours to clash with.

.pc-category stays opaque, so the image beneath cannot affect its contrast;
the test asserts that rather than measuring it over the imagery.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Scroll reveals

**Files:**
- Modify: `src/styles/global.css` (the "Motion" section, before the `prefers-reduced-motion` block at line 408)
- Modify: `src/pages/index.astro`, `projects.astro`, `insights.astro`, `services.astro`, `about.astro` (attach `.reveal`)

**Interfaces:**
- Consumes: nothing.
- Produces: `.reveal` elements, which `tests/motion.mjs` (task 6) already polices.

Spec §7. **The default state is visible.** The hidden-then-revealed state exists only inside both the `@supports` and the `prefers-reduced-motion` guard. The standard way this pattern fails is content that is permanently invisible where the feature is missing.

- [ ] **Step 1: Confirm the guard test currently passes vacuously**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run build && npm run test:motion
```

Expected: passes, printing `(0 .reveal element(s) found across the site)`. The test is real but has nothing to hold yet — after step 3 it will have something, and it must still pass.

- [ ] **Step 2: Add the motion block**

In `src/styles/global.css`, in the "Motion" section, immediately **before** the `@media (prefers-reduced-motion: reduce)` block:

```css
/*
 * Scroll reveals, CSS-only.
 *
 * The default state is VISIBLE. The hidden-then-revealed state exists only
 * inside both guards below, because the standard way this pattern fails is
 * content that is permanently invisible in a browser that cannot run the
 * animation. Nothing here may hide something an unsupporting engine cannot
 * then reveal.
 */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal {
      animation: reveal-in linear both;
      animation-timeline: view();
      animation-range: entry 10% cover 30%;
    }
  }
}

@keyframes reveal-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
```

The `@keyframes` sits outside the guards deliberately — a keyframes rule that is never referenced costs nothing, and keeping it at the top level avoids a nesting mistake silently dropping it.

- [ ] **Step 3: Attach `.reveal`**

Keep this to structural blocks, not individual cards — a grid that fades in item by item is the templated tell this design language exists to avoid.

`src/pages/index.astro`:
- line 115 `<div class="head">` → `<div class="head reveal">`
- line 121 `<ul class="svc-grid">` → `<ul class="svc-grid reveal">`
- line 137 `<div class="position-text">` → `<div class="position-text reveal">`
- line 179 `<div class="card-grid">` → `<div class="card-grid reveal">`
- line 194 `<div class="card-grid">` → `<div class="card-grid reveal">`
- the two other `<div class="head">` at lines 173 and 188 → add `reveal`

`src/pages/projects.astro` line 49: `<div class="card-grid" id="project-grid">` → `<div class="card-grid reveal" id="project-grid">`

`src/pages/insights.astro`: add `reveal` to the `.card-grid` and to the `.faq-list`.

`src/pages/services.astro` and `src/pages/about.astro`: add `reveal` to each section's leading content block — the element directly inside `.container` that holds the heading and body. Do not add it to a `.band-ink` section's contents; the page header already carries its own treatment.

**Do not** add `.reveal` to: the nav, the hero, anything inside `PageHeader`, the footer title block, or any single card.

- [ ] **Step 4: Run the motion guards and verify they still pass**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run build && npm run test:motion
```

Expected: all three scenarios pass, and the count line now reports a non-zero number of `.reveal` elements. If any scenario fails, the guard structure is wrong — the fix is in the CSS, never in the test.

- [ ] **Step 5: Verify by hand that content is not stuck**

```bash
npm run preview
```

Load `/index.html`, scroll through. Then load `/services.html#stormwater` directly and confirm nothing below the anchor is invisible. Then, in the browser's rendering settings, emulate `prefers-reduced-motion: reduce` and reload — everything must be fully visible immediately.

- [ ] **Step 6: Run the full suite**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm test
```

Expected: everything passes, including `test:layout`'s `shipped JavaScript did not grow` — this is a CSS-only reveal and the payload must be byte-identical.

- [ ] **Step 7: Commit**

```bash
git add src/styles/global.css src/pages
git commit -m "$(cat <<'EOF'
feat: add CSS-only scroll reveals

animation-timeline: view(), guarded by both @supports and
prefers-reduced-motion. The default state is VISIBLE: the hidden state exists
only inside both guards, because the standard way this pattern fails is content
that is permanently invisible where the feature is missing.

Attached to structural blocks, not to individual cards — a grid that fades in
item by item is the templated tell this design language exists to avoid.

tests/motion.mjs covers all three failure modes: unsupported, reduced motion,
and already in the viewport on load.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Hero diagram draw-in

**Files:**
- Modify: `src/components/SectionDiagram.astro:88-113` (markup) and `:194-222` (styles)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing other tasks import.

Spec §7 and §13.4. **This is a rewrite, not an addition.** The component already animates `.grade-line` with a hard-coded `stroke-dasharray: 1085`; the existing animation must not be left running alongside the new one.

**The trap in this task:** the existing-ground polyline is *visually dashed* (`stroke-dasharray="10 6"`). You cannot use `stroke-dasharray`/`stroke-dashoffset` for both its dash pattern and a draw-in — the two uses of the property fight, and the result is a dashed line whose dashes crawl. The ground is therefore revealed with a clip sweep, which leaves its dash pattern alone.

- [ ] **Step 1: Normalise the grade line**

In `src/components/SectionDiagram.astro`, add `pathLength="1"` to the `<line class="grade-line">` element (line 104):

```astro
    <line
      class="grade-line"
      pathLength="1"
      x1={gradeLeft[0]}
      y1={gradeLeft[1]}
      x2={gradeRight[0]}
      y2={gradeRight[1]}
      stroke="var(--cut-light)"
      stroke-width="4"
      stroke-linecap="round"
    />
```

- [ ] **Step 2: Add the clip used to sweep the ground in**

In the `<defs>` block (after the `#grid` pattern, line 72), add:

```astro
      <clipPath id="ground-sweep" clipPathUnits="userSpaceOnUse">
        <rect class="sweep-rect" x="0" y="0" width="1200" height="400" />
      </clipPath>
```

The rect is **full width in the markup**. The animation only ever scales it down and back; if the animation never runs, the ground is fully drawn — which is the required default.

- [ ] **Step 3: Apply the clip to the ground polyline and its survey shots**

Wrap the existing-ground `<path>` (lines 88–96) and the survey-shot `<g>` (lines 99–101) in a group carrying the clip:

```astro
    <g class="ground" clip-path="url(#ground-sweep)">
      <!-- Existing ground: the surveyed surface -->
      <path
        d={groundPath}
        fill="none"
        stroke="currentColor"
        stroke-opacity="0.55"
        stroke-width="2.5"
        stroke-linejoin="round"
        stroke-dasharray="10 6"
      />

      <!-- Survey shots -->
      <g fill="currentColor" fill-opacity="0.4">
        {ground.map(([x, y]) => <circle cx={x} cy={y} r="3" />)}
      </g>
    </g>
```

- [ ] **Step 4: Rewrite the animation block**

Replace lines 194–222 of `src/components/SectionDiagram.astro` with:

```css
  /*
   * The one orchestrated moment on the page: the ground sweeps in, the design
   * line draws itself through it, then the hatching resolves. It happens once,
   * on load.
   *
   * The grade line uses pathLength="1", so the dash values are normalised and
   * no path measurement is needed — the previous version hard-coded 1085,
   * which had to be re-derived by hand whenever the line moved.
   *
   * The ground polyline is revealed by a clip sweep rather than by a dash
   * offset, because stroke-dasharray is already carrying its dashed
   * appearance; using it for both makes the dashes crawl.
   */
  @media (prefers-reduced-motion: no-preference) {
    .sweep-rect {
      transform-box: fill-box;
      transform-origin: left center;
      transform: scaleX(0);
      animation: sweep-in 700ms var(--ease) both;
    }

    .grade-line {
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      animation: draw-grade 900ms var(--ease) 400ms forwards;
    }

    .regions {
      opacity: 0;
      animation: resolve 600ms var(--ease) 1150ms forwards;
    }
  }

  @keyframes sweep-in {
    to {
      transform: scaleX(1);
    }
  }

  @keyframes draw-grade {
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes resolve {
    to {
      opacity: 1;
    }
  }
```

The old `stroke-dasharray: 1085` is gone. Confirm by searching the file: `grep -n '1085' src/components/SectionDiagram.astro` must return nothing.

- [ ] **Step 5: Verify the geometry is untouched**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
cd /Users/ryanalmasi/Documents/GitHub/mz-design-consulting-ltd
grep -n '281.5\|684\|222.67\|233.85' src/components/SectionDiagram.astro
grep -n '1085' src/components/SectionDiagram.astro
```

Expected: the first command still shows the solved crossings in `ground`, `fillA`, `cut` and `fillB` exactly as before; the second prints nothing.

- [ ] **Step 6: Verify the reduced-motion default**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run build && npm run test:motion && npm run test:axe
```

Expected: both pass. `motion`'s reduced-motion scenario loads every page — including the five that render `PageHeader`, which embeds `SectionDiagram bare` — and the diagram must be fully drawn in all of them.

- [ ] **Step 7: Look at it live**

```bash
npm run preview
```

Load `/index.html` and watch the sequence once: ground sweeps left to right, the orange grade line draws through it, the hatching resolves. Then load `/projects.html` and confirm the `bare` variant behind the page header does the same at 0.16 opacity without drawing attention.

- [ ] **Step 8: Commit**

```bash
git add src/components/SectionDiagram.astro
git commit -m "$(cat <<'EOF'
refactor: rewrite the hero diagram draw-in onto normalised path lengths

pathLength="1" replaces the hard-coded stroke-dasharray: 1085, which had to be
re-derived by hand whenever the line moved. The existing-ground polyline is now
revealed by a clip sweep rather than a dash offset: stroke-dasharray is already
carrying its dashed appearance, and using it for both makes the dashes crawl.

The solved geometry (crossings at x=281.5 and x=684) is untouched. The clip
rect is full width in the markup, so a browser that never runs the animation
draws the complete section.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Nav condensed state

**Files:**
- Modify: `src/components/Nav.astro:91-108` and the style block
- Modify: `src/components/Logo.astro` (accept `--logo-scale`)
- Modify: `tests/visual.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing other tasks import.

Spec §7, resolved by §13.1: **padding and logo scale only. `--nav-h` does not change.** Animating the bar height desynchronises `scroll-padding-top` in `global.css:29`, `scroll-margin-top` in `services.astro:206` and `insights/[...slug].astro:244,251`, and the sticky offset in `services.astro:216` — in-page anchors would land underneath the bar. That is a navigation regression traded for a visual flourish.

- [ ] **Step 1: Write the failing test**

In `tests/visual.mjs`, add a section before the `finally`:

```js
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
    const scaleTop = await page.evaluate(() => {
      window.scrollTo(0, 0);
      return getComputedStyle(document.querySelector('.site-nav')).getPropertyValue('--logo-scale').trim();
    });
    await page.evaluate(() => window.scrollTo(0, 800));
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
```

- [ ] **Step 2: Run it and watch it fail**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run build && npm run test:visual
```

Expected: FAIL on `the logo scale changes on scroll` (`--logo-scale` is unset today). The height and anchor checks should already pass — they are the regression guard, and they must keep passing after step 3.

- [ ] **Step 3: Add the condensed state**

In `src/components/Nav.astro`, replace the `.nav-inner` rule (lines 91–99) and add the condense block after it:

```css
  .nav-inner {
    display: flex;
    align-items: center;
    gap: var(--s-5);
    max-width: var(--container);
    margin-inline: auto;
    padding-inline: var(--gutter);
    /*
     * FIXED. --nav-h is read by six rules outside this component:
     *   global.css:29                  scroll-padding-top
     *   services.astro:206             scroll-margin-top
     *   services.astro:216             sticky discipline heading
     *   insights/[...slug].astro:244   scroll-margin-top
     *   insights/[...slug].astro:251   scroll-margin-top
     * Animating this height desynchronises every one of them from the real
     * bar and in-page anchors land underneath it. The condense below is
     * padding and logo scale only, which costs nothing and keeps the anchor
     * maths true.
     */
    height: var(--nav-h);
  }

  .site-nav {
    --logo-scale: 1;
    --nav-pad: var(--s-3);
  }

  .nav-brand {
    padding-block: var(--nav-pad);
    transition: padding-block var(--dur) var(--ease);
  }

  @supports (animation-timeline: scroll()) {
    @media (prefers-reduced-motion: no-preference) {
      .site-nav {
        animation: nav-condense linear both;
        animation-timeline: scroll(root block);
        animation-range: 0 160px;
      }
    }
  }

  @keyframes nav-condense {
    to {
      --logo-scale: 0.86;
      --nav-pad: var(--s-2);
    }
  }
```

The `.nav-brand` rule at line 101 already sets `padding-block: var(--s-3)`; replace that declaration with `padding-block: var(--nav-pad)` and keep the rest of the rule as it is.

**`--logo-scale` and `--nav-pad` must be registered to animate.** Un-registered custom properties are not interpolable — the keyframe would snap rather than ease, and `--logo-scale` (a bare number) would not animate at all. Add at the top of the `<style>` block:

```css
  @property --logo-scale {
    syntax: '<number>';
    inherits: true;
    initial-value: 1;
  }

  @property --nav-pad {
    syntax: '<length>';
    inherits: true;
    initial-value: 0.75rem;
  }
```

- [ ] **Step 4: Make the logo respond to the scale**

In `src/components/Logo.astro`, replace the `.logo` rule (lines 54–59) with:

```css
  .logo {
    display: inline-flex;
    align-items: center;
    gap: var(--s-3);
    color: currentColor;
    /* Scales the mark and the wordmark together. --logo-scale is set by
       Nav.astro's condense keyframe; the fallback keeps the component usable
       anywhere else. */
    transform: scale(var(--logo-scale, 1));
    transform-origin: left center;
    transition: transform var(--dur) var(--ease);
  }
```

`.logo` is the outer `<span>` wrapping both `.logo-mark` and `.logo-text`, so one transform covers both. Do not scale `.logo-mark` alone — the wordmark would stay put and the gap would open up.

- [ ] **Step 5: Run the visual test and verify it passes**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run build && npm run test:visual
```

Expected: all checks pass, including — critically — `the bar height does not change on scroll` and `a deep-linked anchor lands below the nav bar`.

- [ ] **Step 6: Verify the anchors by hand**

```bash
npm run preview
```

Load `/services.html#grading`, `/services.html#stormwater` and an article's in-page heading link from its contents list. Each target heading must sit **below** the nav bar, at both 1440px and 390px, before and after scrolling.

- [ ] **Step 7: Run the full suite**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm test
```

- [ ] **Step 8: Commit**

```bash
git add src/components/Nav.astro src/components/Logo.astro tests/visual.mjs
git commit -m "$(cat <<'EOF'
feat: condense the nav on scroll, without moving --nav-h

Padding and logo scale only, via animation-timeline: scroll(). --nav-h stays
fixed because six rules outside Nav.astro derive scroll offsets from it —
global.css:29, services.astro:206 and 216, insights/[...slug].astro:244 and
251. Animating the height would desynchronise all of them and in-page anchors
would land underneath the bar.

tests/visual.mjs asserts the bar height is constant across a scroll and that a
deep-linked anchor still clears the bar, so a later edit cannot make that trade
by accident.

--logo-scale and --nav-pad are @property-registered; un-registered custom
properties do not interpolate and the keyframe would snap.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: Component detailing

**Files:**
- Modify: `src/pages/index.astro` (the `.proof` strip, markup ~lines 89–110 and styles ~lines 263–315)
- Modify: `src/components/ProjectCard.astro` (registration ticks, hatch hover accent)
- Modify: `tests/visual.mjs`

**Interfaces:**
- Consumes: `.reg-marks`, `.hatch-cut` from task 8.
- Produces: nothing other tasks import.

Spec §8. **No numbered callout index on cards** — `MEMORY.md` records that `01/02/03` markers were stripped from the old site as a templated tell and survive in exactly one place, the engineering process, which genuinely is a sequence. A project grid is a set.

- [ ] **Step 1: Write the failing test**

In `tests/visual.mjs`, add before the `finally`:

```js
  // ---- Component detailing (spec §8) --------------------------------------
  section('component detailing');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'load' });

    // The stats strip is re-cut as a ruled drawing schedule but stays a <dl>.
    const proofTag = await page.$eval('.proof-grid', (el) => el.tagName.toLowerCase());
    ok(proofTag === 'dl', 'the stats strip is still a definition list', `<${proofTag}>`);

    const tick = await page.$eval('.proof-item', (el) => getComputedStyle(el, '::before').content);
    ok(tick !== 'none', 'each schedule cell carries a tick mark', `content: ${tick}`);

    const tabular = await page.$eval('.proof-item dd', (el) => getComputedStyle(el).fontVariantNumeric);
    ok(tabular.includes('tabular-nums'), 'schedule values are tabular', tabular);

    // Registration ticks on cards.
    await page.goto(`${base}/projects.html`, { waitUntil: 'load' });
    const marks = await page.$eval('.project-card', (el) => getComputedStyle(el, '::before').borderTopWidth);
    ok(marks !== '0px', 'project cards carry registration ticks', `border-top-width ${marks}`);

    // And no numbered index was reintroduced.
    const numbered = await page.$$eval('.project-card', (els) =>
      els.filter((el) => /^\s*0\d\s*$/.test(el.querySelector('.pc-index')?.textContent ?? '')).length
    );
    ok(numbered === 0, 'no 01/02/03 index on project cards — a grid is a set, not a sequence', `${numbered} found`);

    await ctx.close();
  }
```

- [ ] **Step 2: Run it and watch it fail**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run build && npm run test:visual
```

Expected: FAIL on `each schedule cell carries a tick mark` and `project cards carry registration ticks`. The `<dl>`, tabular and no-numbering checks already pass — they are the guards.

- [ ] **Step 3: Re-cut the stats strip as a drawing schedule**

In `src/pages/index.astro`, replace the `.proof-item` styles (lines 274–300) with:

```css
  /*
   * A ruled schedule the way a drawing sheet carries one: hairline cells, a
   * tick at each cell head, tabular values. Still a <dl> — the pairing is the
   * meaning and it has to survive being read aloud.
   */
  .proof-item {
    position: relative;
    display: flex;
    flex-direction: column-reverse;
    gap: var(--s-2);
    padding: var(--s-6) var(--s-5);
    border-left: var(--border);
  }

  .proof-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: var(--s-5);
    width: 12px;
    height: 1px;
    background: var(--line-strong);
  }

  .proof-item:first-child {
    border-left: 0;
    padding-left: 0;
  }

  .proof-item:first-child::before {
    left: 0;
  }

  .proof-item dt {
    font-size: var(--t-2xs);
    font-family: var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .proof-item dd {
    margin: 0;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum' 1;
    font-size: clamp(1.75rem, 4vw, 2.75rem);
    font-weight: 500;
    line-height: 1;
  }
```

The `dd` elements already carry `class="data"`, which sets the mono family and tabular figures; repeating it here is deliberate so the schedule keeps its figures if that class is ever removed from the markup.

- [ ] **Step 4: Add registration ticks and the hatch hover accent to project cards**

In `src/components/ProjectCard.astro`, replace the `.project-card` rules (lines 54–69) with:

```css
  .project-card {
    position: relative;
    background: var(--bg-raised);
    border: var(--border);
    border-radius: var(--radius);
    /* The whole card is a link; the border marks the hover, not a lift and a
       drop shadow on every card in the grid. */
    transition: border-color var(--dur) var(--ease);
  }

  /* Registration ticks: the corner marks a drawing sheet carries for
     alignment. Decorative, and pseudo-elements, so nothing reaches the
     accessibility tree. */
  .project-card::before,
  .project-card::after {
    content: '';
    position: absolute;
    width: 9px;
    height: 9px;
    pointer-events: none;
    border-color: var(--line-strong);
    border-style: solid;
    transition: border-color var(--dur) var(--ease);
  }

  .project-card::before {
    top: -1px;
    left: -1px;
    border-width: 1px 0 0 1px;
  }

  .project-card::after {
    right: -1px;
    bottom: -1px;
    border-width: 0 1px 1px 0;
  }

  .project-card:hover,
  .project-card:focus-within {
    border-color: var(--accent);
  }

  .project-card:hover::before,
  .project-card:hover::after,
  .project-card:focus-within::before,
  .project-card:focus-within::after {
    border-color: var(--accent);
  }

Then, separately, replace the existing `.pc-body` rule (lines 105–110) with the block below. The hatch is a pseudo-element rather than a `background-image` on `.pc-body` itself, so it can fade from absent to present without the body text ever being painted over.

```css
  .pc-body {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: var(--s-5);
  }

  /* A cut-hatch wash under the card body on hover — the section-drawing
     equivalent of a highlight. No lift, no drop shadow. */
  .pc-body::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0;
    background-image: repeating-linear-gradient(
      45deg,
      var(--hatch-cut-ink) 0 1px,
      transparent 1px var(--hatch-gap)
    );
    transition: opacity var(--dur) var(--ease);
  }

  .project-card:hover .pc-body::before,
  .project-card:focus-within .pc-body::before {
    opacity: 1;
  }

  /* Lifts the text above the wash. Without this the hatch paints over the
     summary and the metrics. */
  .pc-body > * {
    position: relative;
    z-index: 1;
  }
```

- [ ] **Step 5: Run the visual test and verify it passes**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run build && npm run test:visual
```

Expected: all checks pass.

- [ ] **Step 6: Run the contrast probe and the axe sweep**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run test:contrast && npm run test:axe
```

The hatch wash under the card body is a new ground beneath body text. If `axe` reports a contrast violation on `.pc-summary` or `.pc-metric-label`, lower the `18%`/`16%` in `--hatch-cut-ink` until it clears — do not change `--cut` or the text colour.

- [ ] **Step 7: Run the full suite and look at it live**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm test && npm run preview
```

Check the homepage schedule strip and the projects grid, at 1440px and 390px, light and dark.

- [ ] **Step 8: Commit**

```bash
git add src/pages/index.astro src/components/ProjectCard.astro tests/visual.mjs
git commit -m "$(cat <<'EOF'
feat: detail the stats schedule and the project cards

The homepage stats strip is re-cut as a ruled drawing schedule — hairline
cells, a tick at each cell head, tabular mono values — and stays a <dl>,
because the pairing is the meaning and has to survive being read aloud.

Project cards gain corner registration ticks and a cut-hatch wash on
hover/focus. No lift and no drop shadow; the border and the ticks do the work.

Still no 01/02/03 index on cards: those were stripped from the old site as a
templated tell and survive only on the engineering process, which is genuinely
a sequence. A project grid is a set. The test asserts it stays that way.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 15: Full verification, documentation and the session log

**Files:**
- Modify: `docs/IMPROVEMENTS.md` (new subsection under item 7)
- Modify: `docs/superpowers/specs/2026-09-21-ui-stylization-design.md` (status line, §13)
- Modify: `MEMORY.md` (append a session entry)

**Interfaces:**
- Consumes: the measured results of the full suite.
- Produces: nothing.

- [ ] **Step 1: Run everything, from a clean build**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
cd /Users/ryanalmasi/Documents/GitHub/mz-design-consulting-ltd
rm -rf dist
npm run verify && npm test
```

Expected: `verify` at **0 errors, 0 warnings, 0 hints**, 22 pages; then every suite exits 0.

**Write down the actual printed numbers** — checks passed per suite, the undetermined-contrast count, the JS byte count, the `.reveal` element count. They go into the `MEMORY.md` entry. Do not write "tested" without the numbers.

- [ ] **Step 2: Walk the site by hand, both themes, both widths**

```bash
npm run preview
```

At 1440×900 and 390×844, in light and dark:

- Homepage: hero sequence plays once; chainage rule under the hero; schedule strip; grid wash on the two inset bands; match line above the projects grid.
- `/projects.html`: duotone at rest, colour on hover and on tab-through; filter chips; registration ticks.
- `/services.html#grading`: anchor lands below the nav bar, before and after a scroll.
- `/insights.html`: FAQ opens from the keyboard; grid wash behind it.
- An article and a project detail page: heroes still in full colour; inset bands washed.
- The footer title block and the contact form: unchanged.

- [ ] **Step 3: Write the documentation deliverable**

In `docs/IMPROVEMENTS.md`, under item 7 (*Real project photography*), add:

```markdown
### What the 2026-09-21 stylization pass unlocks once real photographs exist

The visual work done in that pass was deliberately built to be photo-ready. It
treats imagery as supporting because the seven stock photographs carried over
from the old site cannot carry a photo-led layout — one is 289×175. With real
project photography, these become available without redesigning anything:

- **Full-bleed photographic section breaks** between major sections, using the
  `.match-line` device as the caption rule.
- **A photographic or video hero** as an alternative to the section diagram.
  The diagram stays as the fallback and on inner page headers.
- **Relaxing or removing the duotone.** It exists to make seven mismatched
  stock images read as one system. Consistent, high-resolution photography of
  your own work does not need it — it is one token (`--duotone-wash`) and two
  short rules in `ProjectCard.astro` and `ArticleCard.astro`.
- **Larger project-detail hero images**, which currently sit modest because the
  sources are not sharp enough to go bigger.
- **Before / during / after earthworks sequences** — the most persuasive format
  available to this business, and impossible with stock imagery.
```

- [ ] **Step 4: Close out the spec**

In `docs/superpowers/specs/2026-09-21-ui-stylization-design.md`, change the status line at the top from:

```markdown
**Status:** approved design, not yet implemented.
**→ Read [§13](#13-open-decisions--answer-before-starting) first.** Three
decisions need answers before any code is written; one of them (the nav) has
ripple beyond this spec.
```

to:

```markdown
**Status:** implemented. See `docs/superpowers/plans/2026-09-21-ui-stylization.md`
for the plan it was built from, and the Session 5 entry in `MEMORY.md` for what
was verified.
**§13 is resolved:** nav condenses padding and logo scale only (`--nav-h` fixed);
`tests/` shipped as its own pass first; the `.pc-category` contrast clause was
dropped as unnecessary.
```

- [ ] **Step 5: Append the session entry to `MEMORY.md`**

Add at the **bottom** of `MEMORY.md`, keeping every earlier section intact:

```markdown
## Session 5 — YYYY-MM-DD — The stylization pass, and a persistent test harness

### Goal

Implement `docs/superpowers/specs/2026-09-21-ui-stylization-design.md` — the
approved visual pass enriching the drawing-sheet language — after answering the
three open decisions in its §13.

### Decisions

[Record the three §13 answers and the reasoning, the card-only duotone scope
call from task 10, and anything you decided during implementation that a
reasonable person would otherwise undo.]

### Changed

[Paths, per pass.]

### Verified

[The real numbers from step 1 and the hand-walk in step 2. Command and result
for each — do not write "tested" without saying how.]

### Known issues / next steps

[What you left and why. Carry forward everything still outstanding from
Session 3.]
```

Fill each section from what actually happened. The header of `MEMORY.md` documents what to cover; follow it rather than this outline where they differ.

- [ ] **Step 6: Final verify and commit**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use >/dev/null
npm run verify && npm test
git add docs MEMORY.md
git commit -m "$(cat <<'EOF'
docs: record the stylization pass and close out the spec

IMPROVEMENTS.md item 7 gains the list of what this design unlocks once real
photography exists; the spec's status line and §13 are marked resolved;
MEMORY.md gets the Session 5 entry.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 7: Report honestly**

State plainly what was not finished and why. Nothing here is pushed — `CLAUDE.md` says commit and push only when the user asks, and branch `revamp` is still local.

---

## Self-review against the spec

Run before declaring the plan complete. Recorded here so a reader can check the same things.

**Spec coverage**

| Spec § | Covered by |
|---|---|
| §4 Typography | Task 7 |
| §5 Depth layer | Tasks 8 (utilities, tokens, contrast) and 9 (placement) |
| §6 Imagery duotone | Task 10 |
| §7 Motion — scroll reveals | Task 11 |
| §7 Motion — hero draw-in | Task 12 |
| §7 Motion — nav condense | Task 13 |
| §8 Components | Task 14 |
| §9 Out of scope | Global Constraints, "Not touched" in File Structure |
| §10 checks 1–9 | Task 1 (check 1 via `verify`), 2 (check 2), 3 (checks 4, 8, 9), 4 (check 3), 5 (check 7), 6 (checks 5, 6) |
| §11 Documentation | Task 15 steps 3–5 |
| §12 Risks | Overflow → task 7 step 6; grid wash contrast → task 8 step 1; scroll-animation support → task 11 and `tests/motion.mjs`; a11y-tree leakage → task 9 step 1; duotone taste → task 10 step 7 |
| §13.1, §13.2, §13.3 | Resolved in "Decisions resolved", implemented in tasks 13, 1–6 and 10 |
| §13.4 draw-in is a rewrite | Task 12, including the `grep -n '1085'` confirmation |
| §13.4 in-viewport-on-load | `tests/motion.mjs` scenario 3, task 6 |

**Known gaps, stated rather than hidden**

- **Spec §10's `tests/` is dev-only and unversioned in CI.** This plan creates the harness and `CLAUDE.md` points at it, but no GitHub Actions workflow is added — that is backlog item 9, now unblocked but out of scope here.
- **Check 5 of spec §10 is simulated, not native.** `tests/motion.mjs` neutralises `animation-timeline` with an injected stylesheet rather than running an engine that genuinely lacks the feature. That proves the content is visible without the animation, which is the property that matters; it does not prove the `@supports` guard is syntactically correct in an engine that fails to parse it. Confirm that by loading the site once in a browser without scroll-driven animation support if one is to hand.
- **The contact API (`CLAUDE.md` verification item 5) is not in the harness.** It needs `wrangler pages dev` and Resend credentials. `tests/README.md` and the `CLAUDE.md` edit in task 6 both say so.
- **`@property` support is assumed for task 13.** Registered custom properties are supported in current Chrome, Safari and Firefox. Where they are not, `--logo-scale` simply does not interpolate and the logo sits at its initial value — the nav still works and nothing is hidden, which is the same "degrade to the resting state" contract the reveals follow.
- **Nothing in this plan is pushed.** Branch `revamp` stays local; `CLAUDE.md` says commit and push only when the user asks.
