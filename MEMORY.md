# Session memory

A running log of agent work on this repository, newest session at the bottom.
Its purpose is to stop the next session from re-deriving decisions that have
already been made, re-discovering bugs that have already been fixed, or
reversing a choice without knowing why it was made.

**Read this file before starting work. Append to it before you finish.**

## How to add an entry

Add a new `## Session N — YYYY-MM-DD — <short title>` section at the **bottom**.
Keep the existing sections intact — do not rewrite history, even if a later
session reverses an earlier decision. If you reverse something, say so in your
own entry and explain why.

Cover:

- **Goal** — what you were asked to do, in the user's terms
- **Decisions** — choices made and the reasoning, especially ones a reasonable
  person would otherwise undo
- **Changed** — what actually moved, with paths
- **Verified** — what you checked, with the command and the result. Do not write
  "tested" without saying how.
- **Known issues / next steps** — what you left, and why

Be specific and honest. If you did not finish something, say so. If you were
unsure about something, say that too — a later session inheriting a false
certainty is worse than inheriting a question.

---

## Session 1 — 2026-09-20 — Full rebuild from static HTML to Astro

### Goal

User asked to "revamp the entire fullstack workflow end to end" for what they
described as a lightweight prototype, brainstorm the approach first, and use the
`frontend-design:frontend-design` and `ui-ux-pro-max` skills. Iteration to
follow.

### Starting state

Six standalone HTML files at the repo root (`index`, `services`, `projects`,
`about`, `insights`, `contact`), no build step, no tooling, one commit
(`7ef77a0`). Served from GitHub Pages on `mzdesignconsulting.com` via the root
`CNAME` file. Total repo weight 26 MB.

### What was wrong (audit findings)

Recorded here because several were not obvious and could be reintroduced:

1. **The contact form was fake.** `submitContact()` validated three fields, then
   set the button to a green "Message Sent" and disabled it. No network call
   existed anywhere in the file. Every enquiry since launch was silently
   discarded while the sender believed they had reached the company.
2. **`contact.html`'s script block was a JavaScript syntax error** — an
   unescaped apostrophe in `'... We'll be in touch ...'`. The whole `<script>`
   failed to parse, which also killed `toggleMobile()`, so the mobile menu was
   dead on that page.
3. **No phone number, email address or office location on any page** of the
   site. The only contact route was the broken form.
4. **26 MB of HTML from 0.9 MB of images.** Seven unique JPEGs were
   base64-inlined 75 times across the six pages. `index.html` alone was 3.7 MB.
5. Every Insights article card (15+), every PDF resource link (6) and every
   project card was a dead link. The four project filter tabs were inert
   buttons.
6. ~400 lines of CSS and the full nav/footer duplicated in all six files.
7. No sitemap, `robots.txt`, canonical URLs, Open Graph/Twitter tags, favicon or
   structured data. `<meta name="keywords">` present (ignored since ~2009).
8. Mojibake from lost UTF-8: `.svc-bullets li::before{content:"4"}` and
   `.marquee-item::after{content:"C6"}` rendered literal `4` and `C6` on screen.
9. Accessibility: no skip link, no focus-visible styles, `aria-expanded` missing
   on the hamburger, FAQ accordions not keyboard-operable, decorative-only alt
   text.
10. Content was entirely generic — no named clients, no real locations, no team
    names, and no APEGA/EGBC registration, which is a core trust signal for an
    engineering consultancy.

### Decisions

Four were put to the user via a question round; their answers are recorded.

- **Astro 7 + TypeScript, static output.** User chose this over Next.js and over
  staying with hand-written HTML. They asked for the reasoning, so it is
  restated here: the site is content, not an application, so React's client
  runtime has nothing to do. Astro ships ~0 KB JS by default against Next's
  ~90–120 KB hydration baseline. That matters most on the target audience's
  actual devices — contractors and PMs on mid-range Android over spotty LTE from
  site trailers, where parse-and-execute cost is 3–4× a desktop's and is CPU
  time that a fast connection does not rescue. Secondary reasons: built-in
  responsive image generation, and type-checked content collections.
  **If a client portal, authenticated drawing downloads or a live dashboard
  enters scope, revisit this** — that is the case where Next.js wins.
- **Cloudflare Pages + Pages Function + Resend** for form delivery, chosen by the
  user over a third-party form endpoint and over mailto-only. **Consequence: the
  site leaves GitHub Pages.** Old URLs are preserved exactly, so no redirect map
  is needed.
- **Visible TODO placeholders** for business details the user will supply later.
  They confirmed the project *text* is real but more project information is
  coming.
- **Six full technical articles written as Markdown**, chosen over trimming to
  stubs or cutting the section.

Two decisions made without asking, both worth knowing:

- **Astro 7, not 5.** Initially scaffolded on `^5.1.1`, which resolved to 5.18.2
  and carried critical advisories including **remote code execution through AVIF
  image optimization** — precisely the feature this site relies on. Checked
  whether a patched 5.x or 6.x line existed that would run on the installed
  Node; none does. Upgraded to 7.3.3, `npm audit` clean.
- **Node 24.21.0 LTS installed via nvm.** Astro 7 requires `>=22.12.0` and hard-
  exits below it; the machine had 22.11.0. nvm held only 22.7.0, and the
  Homebrew Node 23.7.0 install is **broken — the `node` binary is missing from
  its `bin/`, only `corepack`/`npm`/`npx` symlinks remain**. This was a hard
  blocker, not a preference. `.nvmrc` pins `22.12.0`; `package.json` declares
  the engine.

### Design direction

Concept is **the drawing sheet** — the visual vocabulary of civil engineering
drawings (contours, section cuts, hatch patterns, station chainages, title
blocks), on the reasoning that a contractor recognises a drawing set instantly
and no competitor in this market uses it.

- **Palette "Cut & Fill":** graphite `#15181B` on drafting vellum `#EBEBE5`,
  survey-lath orange `#C2410C` reserved for CTAs and the cut hatch, blue-grey
  `#4A5A61` for secondary text and hairlines. The orange exists in **three**
  variants because one hex cannot clear AA on both light and dark grounds —
  `src/styles/tokens.css` records which ratio each is for. Do not collapse them.
- **Type:** Archivo (display) + IBM Plex Sans (body) + IBM Plex Mono, the last
  used **only for real measured values** — elevations, chainages, quantities —
  never as decorative labels.
- **Hero:** inline SVG cut/fill cross section, ~4 KB, no JS. Geometry is solved
  so the surfaces cross exactly at the cut/fill region boundaries (x=281.5 and
  x=684). If you edit the ground polyline you must re-solve those crossings or
  the hatched regions will not meet the grade line.
- **Footer:** built as a drawing title block, which is what makes contact details
  and permit numbers structurally load-bearing rather than optional.

**The `ui-ux-pro-max` skill's palette and type recommendations were rejected
deliberately.** It returned `#0F172A`/`#0369A1`/`#F8FAFC` (Tailwind slate + sky)
and EB Garamond + Lato. The palette is the most-used B2B default in existence;
the type pairing tested as "legal, formal, government" and would dress an
earthworks firm as a law office. Its *structural* guidance — section order, form
accessibility rules, Astro stack guidance — was used. Do not "restore" the
skill's colour/type output thinking it was an oversight.

Also removed deliberately, as templated tells the old site had: tracked-out
uppercase eyebrow above every section, `→` appended to link labels, middle-dot
meta strings, hover-lift + soft shadow on every card. `01/02/03` markers survive
in exactly one place — the engineering process, which genuinely is a sequence.

### Changed

Everything. Six root HTML files deleted, content migrated. New structure:

- `src/site.config.ts` — **single source of truth for every business detail.**
  11 `TODO()` markers remain. Anything unfilled renders as a yellow
  hazard-striped marker, so it cannot ship unnoticed.
- `src/content.config.ts` + `src/content/{projects,insights}/*.md` — 9 projects,
  6 articles, Zod schemas enforced at build time.
- `src/components/` — `SectionDiagram`, `TitleBlock`, `Nav`, `Logo`,
  `ProjectCard`, `ArticleCard`, `PageHeader`, `CtaBand`, `Todo`.
- `src/layouts/Base.astro` — head, SEO, JSON-LD, skip link.
- `src/pages/` — 16 route files; `[...slug]` routes generate project and article
  detail pages. 22 pages built.
- `src/lib/paths.ts` — path normalisation (see gotchas).
- `src/styles/{tokens,global}.css`.
- `src/assets/images/` — the 7 images extracted from the base64.
- `functions/api/contact.ts` — Cloudflare Pages Function.
- `public/` — favicon, generated OG card, robots, `_headers` (CSP + cache),
  `_routes.json`.
- `docs/DEPLOYMENT.md`, `docs/TODO-BEFORE-LAUNCH.md`, rewritten `README.md`.

Committed as **`8a92cf6` on branch `revamp`**. **Not pushed.** `main` is
untouched at `7ef77a0`.

### Bugs found and fixed during the build

All five were caught by looking at rendered output and running checks, not by
reading code. They are logged because each is a class of mistake easy to repeat:

1. **Nav logo invisible.** `.site-nav` set a dark `background` but no `color`, so
   the wordmark and the SVG's `currentColor` strokes inherited the dark body ink
   — dark on dark. The nav *links* looked fine only because each set its own
   colour, which masked it.
2. **JSON-LD rendered as escaped text.** Used `<set:html value={...} />` as if it
   were an element. Correct form is
   `<script type="application/ld+json" set:html={...} />`.
3. **Canonicals disagreed with the sitemap.** `build.format: 'file'` makes
   `Astro.url.pathname` carry `.html`; the sitemap and all internal links are
   extensionless. Conflicting signals to Google.
4. **`aria-current` never matched**, so no page had an active nav state — same
   root cause as #3.
5. **Empty red error icons under every form field.** An author `display: flex`
   beats the UA stylesheet's `[hidden] { display: none }`.

### Verified

Run against the built output on `astro preview`:

- `npm run verify` (`astro check && astro build`) — **0 errors, 0 warnings,
  0 hints**, 22 pages.
- **axe-core**, 9 URLs × 2 viewports (1440×900, 390×844) × light *and* dark, on
  WCAG 2.0/2.1/2.2 A+AA plus best-practice — **0 violations in both themes.**
- 14 contact-form assertions: error summary focus management, `aria-invalid`,
  summary-to-field links, live error clearing, POST reaching `/api/contact`,
  failure surfaced rather than swallowed, button restored.
- 16 interaction assertions: project filter counts, `aria-pressed`, live-region
  announcement, URL sync, deep-linking, mobile drawer open/Escape-close, FAQ
  keyboard operation.
- **Contact API exercised under `wrangler pages dev`** with a deliberately
  invalid Resend key: 405 on GET, 204 on OPTIONS, six validation paths each
  returning the right 400 message, honeypot returning 200-and-drop, and a clean
  502 with a useful message on the Resend failure (confirmed in logs as a real
  401 from Resend — the request genuinely went out).
- HTML escaping and CRLF header-injection stripping unit-checked against script
  tags, attribute breaks and `Bcc:` injection.
- No broken internal links, no console errors, no horizontal overflow at 390px.

Measured: homepage **3.7 MB → 40 KB** (8 KB gzipped). Total JS ~2 KB.

### Known issues / next steps

- **Nothing is pushed.** Branch `revamp` is local. Needs push + PR, or merge.
- **11 TODO placeholders outstanding** — see `docs/TODO-BEFORE-LAUNCH.md`. The
  blocking ones are phone/email/address and the APEGA/EGBC permit numbers.
- **The six articles need P.Eng. review before publishing.** They were written
  deliberately avoiding specific regulatory thresholds and clause numbers,
  because a wrong figure published under an engineering firm's name is a
  professional liability. `draft: true` in frontmatter holds one back.
- **`stats.projectsDelivered: 200` and `yearsExperience: 15` are unverified**,
  carried over from the old site. They appear in several headings. Flagged to
  the user; not yet confirmed.
- **`src/assets/images/tank-farm-containment.jpg` is 289×175** — too small, will
  look soft on the tank farm project. The other six are 800–1200 px.
- **Cloudflare Pages project does not exist yet.** No Resend account, no
  Turnstile keys, DNS still points at GitHub Pages.
- **The Playwright verification scripts were written in an ephemeral job temp
  directory and are gone.** The approach is documented in `CLAUDE.md` so it can
  be recreated. *Suggestion for a future session: if the user wants these to
  persist, add them under `tests/` with `playwright-core` and `axe-core` as
  devDependencies. Not done unasked.*
- Dark mode is implemented and audited but has only been eyeballed on the
  projects page. Worth a fuller visual pass.

### Follow-up in the same session

User asked what else could be added. Audited the build for gaps and wrote
`docs/IMPROVEMENTS.md` — a prioritised post-launch backlog with effort
estimates, plus an explicit "not worth doing" section so rejected ideas do not
get re-proposed. Confirmed missing by inspecting `dist/`: `FAQPage`,
`BreadcrumbList` and `Service` schema; RSS; CI workflow; analytics; `tests/`;
and any city landing pages (11 service areas defined, 0 pages targeting them).

Top of that backlog: analytics first, because without it every other priority
call on the list is guesswork.

---

## Session 2 — 2026-09-20 — Analytics wiring and the structured-data gaps

### Goal

User asked to implement **items 1 and 3** of `docs/IMPROVEMENTS.md`: Cloudflare
Web Analytics, and the three missing schema types (`FAQPage`, `BreadcrumbList`,
`Service`). Items 2 and 4 were not in scope and were not touched.

### Decisions

- **Analytics is wired but disabled, behind a `TODO()` placeholder.** Confirmed
  with the user that no Cloudflare account or beacon token exists yet. Rather
  than hard-code a fake value or leave the work for later, `analytics
  .cloudflareToken` follows the same placeholder pattern as the rest of
  `site.config.ts`, and `Base.astro` emits the beacon **only when it is a real
  value**. Going live is now a one-line edit. Verified both branches: 22/22
  pages carry the beacon with a token set, 0/22 without.
- **No visible `Todo.astro` hazard marker for the token**, unlike every other
  placeholder in that file. A hazard stripe is a *content* affordance; this
  value lives in page chrome and has no visible surface. The trade-off is that
  it is the one pre-launch item that can be forgotten silently, so it got an
  explicit entry (item 9) in `TODO-BEFORE-LAUNCH.md` and a correction to that
  file's opening claim that *every* item renders a marker. **If you add a
  config value with no visible output, do the same — do not reach for
  `Todo.astro`.**
- **Page-level JSON-LD is appended to the existing `@graph`, not emitted as a
  second `<script>`.** `Base.astro` gained a `schema?: Record<string, unknown>[]`
  prop. One graph means page nodes reference `#organization` by `@id` instead of
  restating the firm on every page. If you are tempted to add a second ld+json
  block, add to the graph instead.
- **Breadcrumbs are derived from `canonicalPath`, never `Astro.url.pathname`.**
  This is gotcha #1 landing exactly where the gotcha list predicted: the raw
  pathname would have produced `https://…/services.html` in the trail while the
  canonical tag says `/services`. There is a regression assertion for it.
- **Breadcrumb labels: intermediate segments from `nav`, the leaf from the page
  `title` prop.** That is what makes `/insights/earthwork-balancing` render as
  *Home > Insights > What earthwork balance actually saves you* rather than
  exposing the slug. It does mean `/insights` itself reads as *Home >
  Engineering insights* (title) while its children say *Insights* (nav label).
  Deliberate — the leaf describes the page, the parent names the section. Not a
  bug to "fix" into consistency.
- **`Service` nodes carry the two provinces in `areaServed`, not the 11 service
  areas.** The organization node already enumerates every city; repeating them
  across six services would have added 66 nodes saying nothing new.
- **`hasOfferCatalog` for the `scope` bullets was deliberately omitted.** It is
  the technically correct way to express sub-services, but nothing consumes it
  and it would have roughly tripled the JSON-LD on that page. Raised with the
  user, who did not ask for it. Reconsider only if something concrete needs it.

### Corrected a claim in IMPROVEMENTS.md

Item 3 described `FAQPage` as "free eligibility for expanded search results".
**That is no longer true.** Google restricted FAQ rich results to authoritative
government and health sites in 2023. The markup was still implemented — it is
accurate, near-free, and read by other engines and assistants — but the backlog
entry now says so plainly, so nobody deploys it, sees nothing in Google, and
goes looking for a bug that is not there.

### Changed

- `src/site.config.ts` — new `analytics` export.
- `src/layouts/Base.astro` — `schema` prop, `BreadcrumbList`, guarded beacon.
- `src/pages/insights.astro` — `FAQPage` from the existing `faqs` array.
- `src/pages/services.astro` — 6 × `Service` from the existing `disciplines`.
- `public/_headers` — CSP: `static.cloudflareinsights.com` in `script-src`,
  `cloudflareinsights.com` in `connect-src`. **Two different origins; both are
  required.** Allow only the first and the beacon loads, reports nothing, and
  looks correctly installed in the page source. This is the failure mode the
  backlog warned about and it is a genuinely easy one to ship.
- `docs/DEPLOYMENT.md` — new §3f, including how to confirm it is really
  reporting, and a warning not to combine the config token with the dashboard's
  automatic Pages injection (that yields two beacons and double-counted views).
- `docs/TODO-BEFORE-LAUNCH.md` — item 9, plus the intro correction above.
- `docs/IMPROVEMENTS.md` — items 1 and 3 marked `DONE` with outcomes.

Not committed — the user had not asked at the time of writing.

### Verified

- `npm run verify` — **0 errors, 0 warnings, 0 hints**, 22 pages. Also re-run
  with a real token substituted in, to confirm the fill-in path typechecks.
- **650 structural assertions over `dist/`** via a throwaway Node script: every
  page's JSON-LD parses, carries exactly one block and no escaped markup
  (gotcha #6); expected node types per page; **every `@id` reference resolves to
  a node defined on the same page**; no `.html` in any breadcrumb URL; each
  breadcrumb leaf agrees with that page's canonical tag and `<title>`;
  positions are contiguous from 1; trail depth matches path depth; all 7 FAQ
  questions *and* their answers are actually rendered on the page (Google
  requires the marked-up content to be visible); all 6 service names render and
  each anchor `id` exists in the HTML; `FAQPage`/`Service` appear only on their
  own pages; and no beacon or raw `__todo` object leaks into any output.
- Beacon emission checked **both ways**: 22/22 pages with a token, 0/22 with the
  placeholder.
- Breadcrumb trails eyeballed on article, project, index and `noindex` pages.

### Not done / next steps

- **Google's Rich Results Test was NOT run.** It needs a public URL and nothing
  is deployed. The validation above is structural and local. **Run it against
  the `*.pages.dev` URL once Pages exists** before treating item 3 as fully
  confirmed.
- **The analytics beacon has never executed in a browser.** The tag is correct
  and the CSP is correct by inspection, but "CSP allows it" is a claim that is
  only proved by watching the POST to `/cdn-cgi/rum` return 204. §3f of
  `DEPLOYMENT.md` says exactly what to look for.
- **axe-core was not re-run.** These changes add zero visible UI — no rendered
  markup changed on any page, only `<head>`/`<body>` script and JSON-LD content.
  Flagged to the user, who did not ask for the sweep. If visible breadcrumbs are
  added later (Tier 3), that *does* need a fresh axe pass.
- **The verification script is ephemeral again**, in the job temp directory —
  the same fate as last session's Playwright scripts. Offered to the user to
  persist it under `tests/`; it is zero-dependency and would be a reasonable
  first file there for backlog item 9 (CI). Not added unasked.
- Items 2 and 4 of the backlog remain `TODO`, as do the 11 original launch
  placeholders. Nothing pushed; branch `revamp` is still local.
