# Repository guide for agents

## Read this first

1. **Read [`MEMORY.md`](MEMORY.md) before doing anything else.** It is the log of
   previous agent sessions: decisions made, why they were made, bugs already
   found, and what was deliberately left undone. Several choices in this repo
   look wrong until you know the reasoning.
2. **Append your own entry to `MEMORY.md` before you finish your session.** The
   format and what to cover are documented at the top of that file. Add to the
   bottom; do not rewrite earlier entries.
3. Check [`docs/TODO-BEFORE-LAUNCH.md`](docs/TODO-BEFORE-LAUNCH.md) — the site
   has intentional placeholders that render visibly.

---

## What this is

The marketing and lead-generation site for **M&Z Design Consulting LTD.**, a
civil engineering consultancy working in Alberta and British Columbia. They do
grading design, earthworks and mass haul, stormwater management, drainage and
culverts, road and access design, industrial site development, municipal
infrastructure, and Civil 3D modelling.

Their audience is **land developers, contractors, municipalities and other
engineering firms** — technical B2B buyers. The site's single job is to get those
people to make contact. It is not an application and has no users, accounts or
authenticated state.

Domain: `mzdesignconsulting.com`.

**Stack:** Astro 7 + TypeScript, static output, plus one Cloudflare Pages
Function for the contact form. Hosting is moving from GitHub Pages to Cloudflare
Pages — see `docs/DEPLOYMENT.md`. That migration has not happened yet.

---

## Environment — read before running anything

**Astro 7 requires Node ≥ 22.12 and hard-exits below it.** The default `node` on
this machine is 22.11.0, which fails. Always activate the pinned version first:

```bash
nvm use            # reads .nvmrc → Node 24 LTS
node --version     # confirm >= 22.12.0
```

Every `npm` command in a shell needs this. In a non-interactive shell:

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh" >/dev/null 2>&1 || true
nvm use --lts >/dev/null 2>&1
```

The Homebrew Node 23 install on this machine is **broken** — its `node` binary is
missing. Do not try to use it.

---

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Dev server, hot reload, `:4321`. **No contact function.** |
| `npm run dev:full` | Build + serve via Wrangler on `:8788`, including `/api/contact`. |
| `npm run build` | Static build to `dist/`. |
| `npm run preview` | Serve the built output. |
| `npm run check` | TypeScript + content schema check. |
| `npm run verify` | `check` then `build`. **Run before claiming anything works.** |
| `npm run deploy` | Manual Cloudflare Pages deploy. |

`npm run verify` currently passes at **0 errors, 0 warnings, 0 hints**. Keep it
there — a new hint is a regression, not noise.

---

## Layout

```
src/
  site.config.ts        ← every business detail, one place. Start here.
  content.config.ts     ← Zod schemas; invalid content fails the build
  content/
    projects/*.md       ← 9 projects
    insights/*.md       ← 6 technical articles
  components/
    SectionDiagram.astro  ← the cut/fill hero drawing
    TitleBlock.astro      ← footer, built as a drawing title block
    Todo.astro            ← renders a visible placeholder for unset config
    Nav  Logo  ProjectCard  ArticleCard  PageHeader  CtaBand
  layouts/Base.astro    ← head, SEO, JSON-LD, skip link
  lib/paths.ts          ← path normalisation — see gotchas
  pages/                ← routes; [...slug] files generate detail pages
  styles/tokens.css     ← colour, type, spacing, motion tokens
  styles/global.css     ← reset, primitives, buttons
  assets/images/        ← source photos; Astro generates responsive variants
functions/api/contact.ts  ← Cloudflare Pages Function (own tsconfig)
public/                 ← favicon, OG image, robots, _headers, _routes.json
docs/                   ← deployment + pre-launch checklist
```

---

## Gotchas that will bite you

These are real bugs that were hit and fixed. Reintroducing them is easy.

**1. `build.format: 'file'` makes `Astro.url.pathname` carry `.html`.**
At build time the homepage is `/index.html` and services is `/services.html`,
but every internal link, the sitemap and the canonical tag are extensionless.
Anything comparing the current path to a link href **must** normalise first —
use `isCurrentPath()` / `normalizePath()` from `src/lib/paths.ts`. Getting this
wrong fails silently: `aria-current` simply never matches, and canonicals end up
disagreeing with the sitemap.

**2. A dark background needs an explicit `color`.**
Astro's scoped styles do not cascade a colour for you. A component that sets a
dark `background` but no `color` leaves its text and any SVG `currentColor`
inheriting the light-mode body ink — invisible. `.band-ink`, `.title-block` and
`.page-header` all set `color` deliberately.

**3. Setting `display` on an element that uses the `hidden` attribute breaks it.**
An author `display: flex` outranks the UA stylesheet's `[hidden] { display: none }`.
If a component toggles visibility with `hidden`, pair it with an explicit
`.thing[hidden] { display: none; }`.

**4. `--muted-ink` is how muted text survives dark grounds.**
`.data-sm` and `.muted` read `var(--muted-ink, var(--text-muted))`. Any dark
ground redefines `--muted-ink`. If you add a new dark section, set it, or muted
text there will fail contrast at ~2.5:1.

**5. The orange has three variants and they are not interchangeable.**
`--cut` (fills/buttons), `--cut-text` (orange text on light), `--cut-light`
(orange on dark). One hex cannot clear WCAG AA everywhere. `tokens.css` records
which ratio each clears. Do not consolidate them.

**6. JSON-LD goes in a real script element.**
`<script type="application/ld+json" set:html={JSON.stringify(x)} />`. Building
the tag as a string and passing it to `set:html` renders it as escaped text.

**7. The hero diagram's geometry is solved, not eyeballed.**
In `SectionDiagram.astro` the existing-ground polyline crosses the proposed grade
at exactly x=281.5 and x=684, and the cut/fill region paths depend on those
values. Change the polyline and you must re-solve the crossings or the hatching
will not meet the grade line.

**8. `functions/` has its own `tsconfig.json`** and is excluded from the root
one, because it runs on the Workers runtime with different globals.

---

## Working on this site

**Business details** — `src/site.config.ts`, never hard-coded in a page. Unset
values render as yellow hazard-striped markers via `Todo.astro`, which is
deliberate: it makes a missing phone number loud in review. The previous site
shipped with no contact details on any page.

**Adding a project or article** — write one Markdown file in
`src/content/projects/` or `src/content/insights/`. It joins the index, gets a
detail page, enters the sector filter with a correct count, and appears in the
sitemap. A typo in `category` fails the build rather than shipping a broken
filter. `draft: true` holds an article back.

**Design direction** — documented in `README.md` and, with the reasoning,
in `MEMORY.md`. Short version: the visual language comes from civil engineering
drawings, not from a UI framework. Before changing the palette or typography,
read the design section of `MEMORY.md` — the current choices are deliberate
rejections of generic defaults, and at least one skill will suggest reverting
them.

**Content for an engineering firm carries professional liability.** The articles
avoid citing specific regulatory thresholds, clause numbers and design criteria
on purpose, and say so where requirements vary by jurisdiction. Do not add
specific figures unless the user supplies and confirms them. The same applies to
headline stats.

**The contact form must never fake success.** The previous implementation
displayed a green "Message Sent" and sent nothing. Any change to the form or the
Function has to preserve: real delivery, and honest reporting when delivery
fails.

---

## Verification expectations

Do not report work as done on the strength of a clean build. What was run last
session, and what should be re-run after meaningful UI or content changes:

1. `npm run verify` — must stay at 0/0/0.
2. **axe-core** over every page at 1440×900 and 390×844, in **both** light and
   dark, against `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice`.
   Last result: 0 violations.
3. **Contact form behaviour** in a browser: empty submit focuses the error
   summary and lists every problem with links to each field; errors clear on
   correction; a valid submit POSTs to `/api/contact`; a failure is surfaced,
   not swallowed.
4. **Interaction**: project filter counts and `aria-pressed`, live-region
   announcement, URL sync and deep-linking, mobile drawer open and Escape-close,
   FAQ keyboard operation.
5. **The API under `wrangler pages dev`**: method handling, each validation
   path, honeypot, and graceful failure when Resend rejects.
6. Horizontal overflow and console errors at 390px.

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

---

## Git

- Work is on branch **`revamp`**, one commit ahead of `main` and **not pushed**.
- `main` is the default branch and still holds the original static site.
- Branch before committing if you find yourself on `main`.
- Commit and push only when the user asks.
- End commit messages with:
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- End PR descriptions with:
  `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

---

## Before you finish

- Run `npm run verify` and report the real result.
- **Append your session entry to `MEMORY.md`.**
- Say plainly what you did not finish and why.
