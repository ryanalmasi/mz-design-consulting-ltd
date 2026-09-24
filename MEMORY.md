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

---

## Session 3 — 2026-09-21 — UI stylization spec, and a review of it

Two pieces of work sit under this heading. The spec was written first, in a
session that did not log itself; the review is this session. Both are recorded
together so the trail is continuous.

### Part A — the spec (commit `55f8baa`, unlogged at the time)

A session on 2026-09-21 wrote
`docs/superpowers/specs/2026-09-21-ui-stylization-design.md` (265 lines) and
committed it without appending a `MEMORY.md` entry. The spec defers its own log
entry to §11 as an *implementation* deliverable, which is why it was skipped —
but `CLAUDE.md` asks every session to log, so this is that entry. Nothing was
lost: the spec carries its own reasoning.

**What it proposes.** A visual pass that enriches the existing drawing-sheet
language rather than replacing it. Palette, type families and surface rules stay
exactly as they are. What changes: display type scale (ceiling only), a depth
layer built from drawing devices (grid wash, hatch, registration ticks, chainage
ticks, match lines), a graphite duotone that makes the seven mismatched stock
photos read as one system, and CSS-only motion.

**Direction chosen, and the two rejected.** The user was given three options and
picked *enrich the existing language*. Rejected: *big-firm structure with M&Z
identity* (depends on photography that does not exist), and *full corporate AEC
reskin* (would override the Session 1 design decisions).

**Why PCL and Stantec were not copied literally** — worth keeping, because it
will come up again. A fetch of `stantec.com` showed a full-width 2800×1640 hero
photograph with minimal chrome; `pcl.com` returned no usable visual signal.
What makes those sites look expensive is **photography of real projects at
scale**. M&Z has seven stock images, one of them 289×175. A photo-led structure
without the photographs is worse than what is there now — a large empty hero
holding a soft stock image reads as an abandoned template. Hence imagery stays
supporting, and the duotone does the unifying work.

### Part B — review of the spec (this session)

User asked what the most recent change was, then whether the spec was ready to
implement or whether another plan existed.

**There is no other plan.** `docs/superpowers/specs/` holds that one file, and
there is no accompanying task breakdown — the spec is a design document, not an
implementation plan.

**The spec is strong and essentially ready.** Every token it references
(`--fill`, `--datum`, `--cut`, `--dur-slow`, `--line`) was confirmed to exist in
`tokens.css`. It makes three judgement calls that align with earlier decisions
and should not be "simplified" by a later session: `.chainage` carries no
numerals (invented station values would be decorative labels in survey costume);
no `01/02/03` on project cards (a grid is a set, not a sequence — those markers
were stripped in Session 1); and the `clamp()` floor does not move, only the
ceiling, which is what keeps 390px safe.

**Three gaps were found and written into the spec as a new §13**, so the next
implementer meets them in the document they will actually open rather than here:

1. **Blocking — "nav condensed state" is unspecified.** §7 gives the mechanism
   but not the effect. `--nav-h` is load-bearing in **six** places outside
   `Nav.astro` (`global.css:29`, `Nav.astro:98`, `services.astro:206,216`,
   `insights/[...slug].astro:244,251`). Animating the bar's height
   desynchronises every `scroll-margin-top` and `scroll-padding-top` from the
   real bar, so in-page anchors land underneath it. Recommended resolution:
   condense padding and logo scale only, leave `--nav-h` fixed.
2. **Scope — does `tests/` ship in this pass or its own?** §10 bundles creating
   the test harness into a visual pass, roughly doubling it. Recommended: build
   `tests/` first against the *current* UI to establish a green baseline, then
   do the visual work against it, so a regression shows up as a test flipping
   rather than a remembered number.
3. **One unnecessary check.** §10 check 3 asks to re-measure `.pc-category`
   contrast over the duotoned imagery. That chip is opaque
   (`background: var(--ink)`), so the image beneath cannot affect it.

Plus two non-blocking notes now in §13.4: the hero draw-in is a **rewrite** of
the existing `stroke-dasharray: 1085` animation rather than an addition, and
check 5 covers `animation-timeline` being unsupported but not the other common
misfire — an element already in the viewport on load settling at the wrong end
of its range.

### Changed

- `docs/superpowers/specs/2026-09-21-ui-stylization-design.md` — status line now
  points at §13; new §13 records the three open decisions and two notes. **The
  design itself is unchanged.**
- `MEMORY.md` — this entry.

### Verified

Nothing was built, so there is nothing to verify beyond the claims made above.
Each was checked rather than asserted: token existence by `grep` over
`tokens.css`; the six `--nav-h` dependencies by `grep -rn 'var(--nav-h)' src/`;
`.pc-category` opacity by reading `ProjectCard.astro`; the existing hero
animation by reading `SectionDiagram.astro:201-214`. `npm run verify` was not
re-run — no code changed, only two Markdown files.

### Where a fresh session picks up

**To implement the stylization pass** — read the spec, answer §13.1 and §13.2
with the user (13.1 in particular is a real trade, not a formality), then build.
The verification bar in §10 is mandatory for this work because it is visible UI:
full axe sweep, all pages × 2 viewports × 2 themes.

**Everything else still outstanding**, unchanged from Session 2:

- 11 launch placeholders in `src/site.config.ts` — phone, email, address and the
  APEGA/EGBC permit numbers are the blocking ones.
- Google Rich Results Test never run (needs a public URL; nothing is deployed).
- The analytics beacon has never executed in a browser.
- Backlog items 2 (city landing pages) and 4 (prequalification badges) are
  `TODO`; item 9 (CI) is blocked on `tests/` existing.
- The six articles still need P.Eng. review before publishing.
- `stats.projectsDelivered: 200` and `yearsExperience: 15` still unverified.
- **Nothing is pushed.** Branch `revamp`, local only.

---

## Session 4 — 2026-09-21 — Implementation plan for the stylization pass

### Goal

User asked to pick up where Session 3 left off, flagging that they were running
a large model **only up to the implementation step** and that the code writing
would happen after. So this session closed the spec's open decisions and wrote
the plan; it wrote no site code.

### Decisions

The spec's §13 held three open items. All three were put to the user with the
trade-offs and their answers are now binding. **Do not reopen them.**

- **§13.1 — the nav condenses padding and logo scale only. `--nav-h` stays
  fixed.** The alternative (animating the bar height) was presented with its
  real cost: `--nav-h` is read by six rules outside `Nav.astro`
  (`global.css:29`, `Nav.astro:98`, `services.astro:206,216`,
  `insights/[...slug].astro:244,251`), and animating it desynchronises every
  scroll offset from the real bar, so in-page anchors land underneath it. The
  user chose the fixed-height option. The plan adds a regression test that
  asserts the bar height is constant across a scroll *and* that a deep-linked
  anchor still clears the bar, so this cannot be traded away by accident later.
- **§13.2 — `tests/` ships as its own pass, first, against the current UI.**
  Two passes rather than one. A regression then shows up as a test flipping
  rather than as a number someone has to remember, and Pass A is committed
  green before any pixel moves.
- **§13.3 — the `.pc-category` contrast clause is dropped**, as the Session 3
  review recommended. The chip is `background: var(--ink)`, opaque, so the
  duotone beneath cannot affect it. The plan asserts it *stays* opaque instead.

Two further calls made while writing the plan, both worth knowing because a
later session could reasonably undo them:

- **The duotone applies to card media only** (`.pc-media`, `.ac-media`), not to
  the three large single images — the project detail hero, the article hero,
  the About intro. Spec §6 says "all project and article imagery"; this is a
  narrower reading, on the grounds that the duotone's job is making a *grid* of
  seven mismatched stock photos read as one set. A lone large image has no
  neighbours to clash with, and greying out the single photograph of the work
  makes it look like a placeholder. **Flagged as a taste call to look at live**
  (plan task 10, step 7); it reverts by itself without touching anything else.
- **Test files are `.mjs`, deliberately.** `tsconfig.json` includes `**/*.ts`,
  `**/*.tsx` and `**/*.astro` only, so `.mjs` keeps the harness out of
  `astro check` and the 0/0/0 bar keeps measuring the site rather than the
  tests. A `.ts` file added under `tests/` would enter the type check and has to
  satisfy `astro/tsconfigs/strict`.

### Changed

- `docs/superpowers/plans/2026-09-21-ui-stylization.md` — new, ~1100 lines. 15
  tasks: six building `tests/` against the current UI (Pass A), eight doing the
  visual work (Pass B), one closing out docs and the log. Every task carries the
  files it touches, the assertion to write first, the command to run, the
  expected failure, the implementation, and the commit message.
- `MEMORY.md` — this entry.

**No site code changed. `npm run verify` was not re-run** — nothing it measures
moved. The last recorded result stands at 0 errors, 0 warnings, 0 hints.

### Things found while writing the plan that are not in the spec

Each was checked against the code, not assumed:

1. **The hero draw-in cannot reuse `stroke-dasharray` for the existing-ground
   polyline.** That path is *visually dashed* (`stroke-dasharray="10 6"` in
   `SectionDiagram.astro:95`). Using the same property for a draw-in makes the
   dashes crawl instead of the line drawing. The plan reveals the ground with an
   animated clip sweep instead, which leaves the dash pattern alone. Spec §7
   says "polylines animate `stroke-dashoffset`"; for that one path it cannot.
2. **`.ac-media` has no `position`** (`ArticleCard.astro:83`). The duotone tint
   is an `::after` with `inset: 0`, so without adding `position: relative` the
   tint escapes to the nearest positioned ancestor and covers the whole card.
   `.pc-media` already has it. Silent failure, easy to ship.
3. **`--logo-scale` and `--nav-pad` must be `@property`-registered** or the nav
   condense will not interpolate — an unregistered custom property holding a
   bare number does not animate at all, it snaps.
4. **The hatch inks cannot be derived only in `:root`.** `--cut` and `--fill`
   are *not* redefined in dark mode (only `--accent` switches to `--cut-light`),
   so a hatch keyed to them reads too dark on the dark grounds. The plan defines
   `--hatch-cut-ink` / `--hatch-fill-ink` in all three theme blocks. Gotcha #4's
   shape, in a new place.
5. **A grid wash on a band will legitimately raise axe's colour-contrast
   *incomplete* count**, because a `background-image` makes axe unable to
   determine contrast for text over it. That is not a violation and not a
   regression. The plan holds that count to a committed number in
   `tests/baseline.json` and requires re-measuring it in the same commit as the
   change that moved it, with the reason — never silently, and never to make an
   unrelated failure disappear. `tests/contrast.mjs` measures the same pairs
   analytically and more strictly, against the *darkest* point of the wash
   (two crossing 50% lines) rather than its average.

### Verified

Nothing was built, so there is nothing to verify beyond the claims above. Each
was checked rather than asserted: the six `--nav-h` dependencies by
`grep -rn 'var(--nav-h)' src/`; `.ac-media`'s missing `position` and
`.pc-category`'s opaque `var(--ink)` background by reading the two card
components; the existing draw-in and its hard-coded `stroke-dasharray: 1085` by
reading `SectionDiagram.astro:199-222`; the theme token coverage by reading all
three blocks of `tokens.css`; the `.mjs` exemption by reading `tsconfig.json`;
and the cached Chromium by `ls` on
`~/Library/Caches/ms-playwright/chromium-1179/chrome-mac/Chromium.app/Contents/MacOS/Chromium`,
which exists.

### Known issues / next steps

- **The plan is written but not executed.** Start at Pass A task 1. Pass A must
  be committed green against the *current* UI before any visual change — if a
  check fails there, fix the check or record the number, do not change the site.
- **The plan is not committed.** `CLAUDE.md` says commit only when the user asks
  and they had not at the time of writing.
- **Two gaps in the plan are stated in it rather than solved**, in its
  self-review section: the harness simulates "`animation-timeline` unsupported"
  with an injected stylesheet rather than a browser that genuinely lacks the
  feature, and the contact API (verification item 5) stays a manual check
  because it needs `wrangler pages dev` and Resend credentials.
- **Backlog item 9 (CI) becomes unblocked** the moment Pass A lands, but no
  workflow is added — that is still its own piece of work.
- Everything outstanding from Session 3 is unchanged: 11 launch placeholders,
  Google Rich Results Test never run, the analytics beacon never executed in a
  browser, backlog items 2 and 4, the six articles awaiting P.Eng. review, and
  the two unverified stats. **Nothing is pushed.** Branch `revamp`, local only.

---

## Session 5 — 2026-09-23 — The stylization pass, and a persistent test harness

### Goal

Implement `docs/superpowers/specs/2026-09-21-ui-stylization-design.md` — the
approved visual pass enriching the drawing-sheet language — after answering the
three open decisions in its §13, then run full verification, write the closing
documentation, and log this session. Executed as 15 tasks under SDD (see
`.superpowers/sdd/2026-09-21-ui-stylization/progress.md` for the complete,
authoritative task-by-task ledger this entry draws from): Pass A (tasks 1–6)
built a Playwright + axe-core verification harness under `tests/` against the
*current* UI; Pass B (tasks 7–14) did the visual work; task 15 (this entry) is
final verification and close-out. Task 15 itself needed three rounds of
corrective fixes before it could close — see below.

### Decisions

**The three §13 decisions, and how they held up during implementation:**

- **§13.1 — nav condenses padding and logo scale only; `--nav-h` stays fixed.**
  Held throughout. Task 13's review confirmed `--nav-h` and `.nav-inner`
  height genuinely untouched by direct diff read; the plan's own regression
  test (bar height constant across a scroll, deep-linked anchor still clears
  the bar) passed at every subsequent check, including the final Session 5
  re-verification. Progress-log framing: "the plan's single most binding
  decision (`--nav-h` fixed) held throughout."
- **§13.2 — `tests/` ships as its own pass, first, against the current UI.**
  Held. Pass A (tasks 1–6) landed a green baseline (axe 89/89, layout 177/177,
  contrast 22/22, interaction 35/35, motion 67/67 vacuous-pass, verify 0/0/0)
  before any pixel of Pass B moved, exactly as designed — a regression in
  Pass B then showed up as a test flipping, which is precisely what happened
  in this session's fix chain (below), rather than as a remembered number.
- **§13.3 — the `.pc-category` contrast clause is dropped.** Held. The chip
  stayed `background: var(--ink)`, opaque; `tests/interaction.mjs`'s "duotone"
  section asserts it *stays* opaque rather than re-measuring contrast over the
  image, and that assertion has passed in every run including the final one.

**Task 10's duotone scope call.** The duotone applies to card media only
(`.pc-media`, `.ac-media`), not to the three large single images — the
project-detail hero, the article hero, the About intro. Spec §6 literally says
"all project and article imagery"; this is a deliberately narrower reading, on
the grounds that the duotone's job is making a *grid* of seven mismatched
stock photos read as one set, and a lone large image has no neighbours to
clash with. Confirmed still true by reading both detail-page templates
directly in this session: `src/pages/projects/[...slug].astro` and
`src/pages/insights/[...slug].astro` both render their hero `<Image>` with no
duotone filter class, while both also carry `.section.band-inset.sheet-grid`
lower on the page — the grid wash *is* applied to detail pages, only the
duotone is scoped away from the three large heroes. This was flagged in the
plan as a taste call to look at live and remains one (see Known issues).

**Notable in-flight rulings a later reader should know about, and might
otherwise second-guess** — pulled from `progress.md`'s task-by-task entries:

- **Task 8 — `tests/lib/color.mjs` widened to parse the `color(srgb r g b [/
  a])` format.** This Chromium build (138.0.7204.23, the one pinned for the
  harness) serializes *every* `color-mix()` result this way rather than as
  `rgb()`/`rgba()`. Without the widening, `tests/contrast.mjs` crashes
  (uncaught exception, not a failed assertion) the instant it evaluates a
  `color-mix()`-based token such as `--grid-line`. This is a real,
  independently-verified environmental fact about the test browser, not a
  workaround for a site bug — `color.mjs` scales 0–1 floats to 0–255 for r/g/b
  and leaves alpha unscaled, hand-traced and confirmed correct in review. Task
  10's `--duotone-wash` (also `color-mix()`-based) needed the identical fix
  regardless, so this was necessary shared infrastructure, not scope creep.
- **Task 12 — a genuine self-contradiction in the plan's own text, resolved.**
  The plan's Step 4 CSS comment, meant to be copied verbatim, literally
  contained the digit string "1085" in its explanatory prose, while the same
  step's grep check required that exact string to be *absent* from the final
  file (the point being: no trace of the old magic number in functional code).
  Resolved by rewording the one sentence to describe that a number had existed
  without repeating the digits ("the previous version hard-coded the path's
  pixel length" instead of naming it). Purely cosmetic; no geometry or
  animation logic changed.
- **Task 13 — two real bugs found in the plan's own literal prescribed code.**
  (1) The brief's exact 3-declaration `animation`/`animation-timeline`/
  `animation-range` CSS form gets folded by Vite's esbuild CSS minifier into a
  single `animation` shorthand the pinned test Chromium doesn't support in
  shorthand form — `animation-name` silently computes to `none`, so the nav
  condense never ran in the *built* output despite looking correct in source.
  Fixed with a `--nav-timeline` custom-property indirection (a minifier can't
  fold through a `var()`). (2) The brief's literal test capture used two-arg
  `scrollTo(0, 0)` and read the computed style in the same tick; this fails
  deterministically because of pre-existing `scroll-behavior: smooth` (the
  scroll position hadn't reached 0 yet) *and* because a scroll-timeline-driven
  custom property only recomputes on the next rendering frame even with an
  instant scroll. Fixed with `behavior: 'instant'` plus a short wait. Both were
  verified directly against the diff before being accepted, and — critically
  for this session — **this exact minifier-folding bug class recurred on
  `.reveal` and is the root cause of the entire Task 15 fix chain below.**
- **Task 14 — a baseline-vs-violation mismatch.** The plan anticipated real
  axe contrast *violations* on `.pc-summary`/`.pc-metric-label` as the failure
  mode, with a sanctioned fix (lower `--hatch-cut-ink`'s mix percentage). The
  actual outcome was different: zero violations anywhere; instead
  `colorContrastIncomplete` rose from 1810 to 2114, because `.pc-body::before`'s
  `background-image` (even at zero opacity at rest) makes axe unable to rule
  out contrast for every card-body text node — axe flags the *presence* of a
  background-image, not its strength. The implementer correctly recognized
  this matched the *already-established* baseline-re-measure protocol from
  Tasks 9/10, not the plan's specific-but-inapplicable suggested fix, and used
  the right one. No token was touched; zero real contrast risk either way.

**The entire post-Pass-B fix chain, run inside this task (Task 15).** The
first genuinely clean build+test run of the whole plan (`rm -rf dist &&
npm run verify && npm test` — Pass A and Pass B had each been verified
incrementally, but never together from a truly clean `dist/`) surfaced a real,
load-bearing regression that had shipped, reviewed, and gone unnoticed since
Task 11's original commit (`1b6001c`):

1. **Bug 1 — the same minifier-shorthand-folding bug class Task 13 already
   found, recurring on `.reveal`.** `.reveal`'s three declarations
   (`animation`/`animation-timeline`/`animation-range`) were folded by the CSS
   minifier into one `animation: linear both reveal-in view()` shorthand the
   pinned Chromium doesn't support, so `.reveal` content sat permanently
   invisible or stuck at a fractional opacity across `/index.html`,
   `/about.html`, `/insights.html`, `/projects.html` and `/services.html`.
   Task 11 shipped *before* Task 13 discovered this bug class, and nobody
   went back to check whether the identically-shaped `.reveal` rule had the
   same exposure. It did. Fixed (commit `5f48d00`) with the same
   `--reveal-timeline` custom-property indirection pattern.
   A `/404.html` console-error finding investigated alongside this turned out
   to be unrelated: a stray leftover `astro dev` process from an unrelated
   earlier session was squatting on port 4321 and intercepting the harness's
   requests. No code fix — killing the process resolved it.
2. **Bugs 2 and 3 — surfaced only once Bug 1 was genuinely fixed, both
   confirmed pre-existing since Task 11's original commit** (verified via a
   `git worktree` comparison against `1b6001c`, before Tasks 12–14 — not
   introduced by this session, and never actually exercised end-to-end by
   `npm test` until now, because Bug 1 had silently prevented `.reveal`'s
   animation from ever running in any built output before, which coincidentally
   made every `.reveal` check pass by accident). (a) A real design gap:
   `animation-range: entry 10% cover 30%` legitimately computed ~43% opacity
   for large structural blocks already substantially inside the viewport at
   load with zero scrolling — exactly the risk Session 3's spec review had
   flagged in §13.4 but which nothing had caught until Bug 1 stopped masking
   it. This was also the direct cause of 4 real axe contrast violations on
   `/services.html` (the blended partial-opacity ink failed WCAG). Fixed
   (commit `4c5a5c0`) via genuine empirical iteration — `entry 10% cover 30%`
   → `entry 0% entry 5%` → `entry 0% entry 15%` (worse, confirmed the wrong
   direction) → `entry 0% entry 2%` (stable across 5 runs) → `entry 0% entry
   4%` (regressed) → settled on **`entry 0% entry 2%`**. (b)
   `tests/motion.mjs`'s "animation-timeline unsupported" simulation had never
   actually applied since Task 6 wrote it: its `ctx.addInitScript` callback
   hit a null `document.documentElement` in this Playwright/Chromium
   combination and threw silently. Fixed in the same commit by switching to
   per-page `page.addStyleTag()` issued after `goto` and before assertion.
3. **Bug 4 — one more test-only inconsistency, found during Bug 3's
   iteration.** `tests/motion.mjs`'s deep-link check asserted *all* `.reveal`
   elements unfiltered, incorrectly flagging `ol.process` (genuinely below the
   fold from that anchor) as "stuck," while its sibling check just above it
   already filtered to near-viewport elements. Fixed (commit `7ae8e41`) by
   applying the same viewport-proximity filter to the deep-link check.

All three fix-round commits were independently reviewed and approved (0
Critical/Important findings across all three). Each round's fix was verified
against the actual built `dist/` CSS and/or the live preview server's served
bytes, not just source. **A worth-noting design trade-off**: the reviewer
flagged, and the implementer agreed, that the tightened `entry 0% entry 2%`
range makes the reveal effect closer to a near-instant "flick" than the
originally-intended graduated scroll-tied transition, especially for large
elements. This was necessary to fix a real correctness/accessibility bug and is
judged a legitimate motion-design trade-off, not a defect — but it is a
visible behaviour change from the spec's original intent and worth a second
look once someone can watch it scroll.

### Changed

- `docs/superpowers/plans/2026-09-21-ui-stylization.md` — new in an earlier
  session, executed here. (Untouched by this session except that its own
  markdown fence-count bug in the Task 14 section was newly discovered — see
  Known issues.)
- **Pass A** (`tests/` harness, commits `f2da1bf..ab52cd5`): `tests/browser.mjs`,
  `server.mjs`, `pages.mjs`, `report.mjs`, `smoke.mjs`, `axe.mjs`, `layout.mjs`,
  `contrast.mjs` (+ `tests/lib/color.mjs`), `interaction.mjs`, `motion.mjs`,
  `baseline.json`, `tests/README.md`; `package.json` test scripts; a
  `CLAUDE.md` paragraph pointing at the harness.
- **Pass B** (visual work, commits `0cd3022..b6bcdc0`): `src/styles/tokens.css`
  (display type scale, depth-layer tokens, per-theme hatch inks),
  `src/styles/global.css` (`.sheet-grid`, `.hatch-*`, `.reg-marks`, `.chainage`,
  `.match-line`, `.reveal`), `src/components/SectionDiagram.astro` (hero
  draw-in rewrite onto normalised path lengths), `src/components/Nav.astro`
  (nav condense, `--logo-scale`/`--nav-pad` as `@property`), `src/components/
  ProjectCard.astro` and `ArticleCard.astro` (duotone, registration ticks),
  page templates for `index.astro`, `about.astro`, `services.astro`,
  `insights.astro`, `projects.astro`, and both `[...slug].astro` detail routes
  (drawing-device placement, schedule-strip markup).
- **Task 15 fix chain** (commits `5f48d00`, `4c5a5c0`, `7ae8e41`):
  `src/styles/global.css` (`--reveal-timeline` indirection; `.reveal`'s
  `animation-range` retuned to `entry 0% entry 2%`), `tests/motion.mjs`
  (`addStyleTag` replacing `addInitScript`; deep-link check filtered to
  near-viewport elements matching its sibling).
- **This session's own edits**: `docs/IMPROVEMENTS.md` (new subsection under
  item 7, "What the 2026-09-21 stylization pass unlocks once real photographs
  exist"); `docs/superpowers/specs/2026-09-21-ui-stylization-design.md`
  (status line changed from "approved design, not yet implemented" to
  "implemented," §13 marked resolved); `MEMORY.md` (this entry).

### Verified

**From a genuinely clean state** (`lsof -ti:4321,4322 | xargs kill -9`,
`rm -rf dist`, then `npm run verify && npm test`, one complete successful run,
all commands run under `nvm use` for Node 22.12.0):

- `npm run verify` (`astro check && astro build`) — **0 errors, 0 warnings, 0
  hints**, 22 pages.
- `npm test` (`build && test:axe && test:layout && test:contrast &&
  test:interaction && test:motion && test:visual`), every suite exit 0:
  - **axe: 89/89 checks passed.** 1778 undetermined-contrast nodes measured
    across 22 pages × 4 renderings (theme × viewport) — this is the
    `background-image`-makes-contrast-indeterminate bookkeeping described in
    Tasks 9/10/14, not a violation; comfortably under the committed baseline.
  - **layout: 177/177 checks passed.** Shipped JS: 2087 bytes (baseline 2087,
    unchanged — the visual pass is CSS-only, as constrained). No horizontal
    overflow, no console errors, any page, either theme, either viewport.
  - **contrast: 26/26 checks passed** (11 token pairs × 2 themes, analytic
    WCAG measurement including the grid wash at its darkest crossing point).
  - **interaction: 39/39 checks passed** (project filter counts/`aria-pressed`/
    live region/URL sync/deep-link, mobile drawer, FAQ keyboard operation,
    duotone at-rest/focus-within/tint-layer/category-chip-opacity). One
    standalone re-run of this suite, mid-session, hit a 30-second Playwright
    timeout waiting on `.pc-category` — retried in isolation immediately after
    and passed 39/39 with no code change; did not recur in the final clean
    full-suite run recorded above. Treated as a transient flake (system
    resource contention across repeated browser-context churn), not a
    regression — flagged here rather than silently discarded.
  - **motion: 67/67 checks passed.** 17 `.reveal` elements found across the
    site; all pass under animation-timeline-unsupported simulation,
    `prefers-reduced-motion: reduce`, and in-viewport-on-load (including the
    `/services.html#stormwater` deep-link case).
  - **visual: 24/24 checks passed** (type scale, drawing devices, nav condense,
    component detailing).

**Step 2 — hand-walk-by-checklist coverage mapping.** No screenshot/visual
tooling was available to this session, so each bullet from the plan's Step 2
checklist was instead matched to the automated test that covers its exact
correctness claim, confirmed passing from the Step 1 run above:

| Step 2 bullet | Covering test | Result |
|---|---|---|
| Homepage — hero sequence plays once | *(none — animation feel, not correctness)* | **Not covered — human-review item, see below** |
| Homepage — chainage rule under the hero | `tests/visual.mjs` "drawing devices" (`placement.chainage >= 1`, no invented station text) | Pass |
| Homepage — schedule strip (structure only) | `tests/visual.mjs` "component detailing" (`.proof-grid` stays a `<dl>`, tick-mark `::before`, `tabular-nums`) | Pass |
| Homepage — grid wash on the two inset bands | `tests/visual.mjs` "drawing devices" (`insetBandsWithGrid === insetBands`, `gridOnInk === 0`) + `tests/contrast.mjs` (grid wash at darkest crossing point) | Pass |
| Homepage — match line above the projects grid | `tests/visual.mjs` "drawing devices" (`placement.matchLine >= 1`) | Pass |
| `/projects.html` — duotone at rest / colour on tab-through | `tests/interaction.mjs` "duotone" (resting filter ≠ none; focus-within clears filter and tint). `:hover` and `:focus-within` share one comma-joined CSS rule in `ProjectCard.astro`, so the keyboard-tested path is the identical rule pointer-hover also triggers — not a separate untested code path, but true mouse-hover itself was not dispatched by the harness | Pass (mechanism identical to hover; hover-as-pointer-event not literally simulated) |
| `/projects.html` — filter chips | `tests/interaction.mjs` "project filter" (counts, `aria-pressed`, live region, URL sync, deep link) | Pass |
| `/projects.html` — registration ticks | `tests/visual.mjs` "component detailing" (`border-top-width ≠ 0`, no `01/02/03` reintroduced) | Pass |
| `/services.html#grading` — anchor lands below the nav bar, before/after scroll | `tests/visual.mjs` "nav condense" (bar height constant on scroll, `--nav-h` unchanged, anchor clears bar) + `tests/motion.mjs` deep-link scenario. Both exercise `#stormwater`; `#grading` and `#stormwater` are generated from the same templated `{d.id}` mechanism in `services.astro`, confirmed by direct source read | Pass (via the shared generic mechanism, not `#grading` literally) |
| `/insights.html` — FAQ opens from the keyboard | `tests/interaction.mjs` "faq" (Enter opens/closes, starts closed) | Pass |
| `/insights.html` — grid wash behind the FAQ | *(no per-page assertion; confirmed by source read: `insights.astro:93` carries `.section.band-inset.sheet-grid`, same token path `tests/contrast.mjs` verifies analytically)* | Confirmed by source read, not a page-specific automated check |
| Article + project detail page — heroes still full colour | *(no automated assertion; confirmed by source read: both `[...slug].astro` hero `<Image>` elements carry no duotone filter class)* | Confirmed by source read, matches Task 10's reviewed scope call |
| Article + project detail page — inset bands washed | *(no per-page assertion; confirmed by source read: both detail templates carry `.section.band-inset.sheet-grid`)* | Confirmed by source read |
| Footer title block and contact form — unchanged | Out of scope for this spec (§9); `tests/layout.mjs` and `tests/interaction.mjs` cover no regressions in what they already test elsewhere on every page | Pass (no regression signal anywhere) |

**Three items are genuinely uncovered by any automated check and need a
human's eyes** — already known and flagged in `progress.md`, not re-verified
here: **Task 10's duotone taste-call** (does the grey-down actually read as
"one system" rather than "washed out"?), **Task 12's hero animation feel**
(does the draw-in sequence read well, and does it play once rather than
looping or feeling laggy?), and **Task 14's schedule-strip/card-detail look**
(does the ruled-schedule stats strip and the card registration-tick detailing
actually look considered rather than merely pass its structural assertions?).
All three are at `/index.html`, `/projects.html`, `/insights.html`,
`/services.html`, both themes, both viewports.

### Known issues / next steps

**Carried forward from Session 3/4, still true:**

- 11 launch placeholders in `src/site.config.ts` — phone, email, address and
  the APEGA/EGBC permit numbers are the blocking ones.
- Google Rich Results Test never run (needs a public URL; nothing is deployed).
- The analytics beacon has never executed in a browser.
- Backlog items 2 (city landing pages) and 4 (prequalification badges) are
  `TODO`; item 9 (CI) is unblocked now that `tests/` exists but no workflow is
  added.
- The six articles still need P.Eng. review before publishing.
- `stats.projectsDelivered: 200` and `yearsExperience: 15` still unverified.

**New from this session:**

- **Three human-review items, listed above, need a person to actually look at
  the live site** — the duotone's taste-call, the hero draw-in's feel, and the
  schedule-strip/card-detail look. All have full automated *correctness*
  coverage already (nothing is broken); what's unverified is whether they look
  right, which no subagent in this SDD run had screenshot tooling to check.
- **The tightened `.reveal` `animation-range: entry 0% entry 2%` is a
  near-instant "flick" rather than a graduated scroll-tied reveal**,
  especially for large structural blocks. Necessary to fix a real correctness
  and WCAG contrast bug (see Decisions); flagged by both the implementer and
  an independent reviewer as a legitimate but visible trade-off. Worth
  revisiting if a future session wants a more graduated feel — but do not
  loosen the range without re-running `tests/motion.mjs`'s in-viewport-on-load
  scenario and `tests/axe.mjs`, since loosening it is exactly what caused the
  original regression.
- **The CSS minifier's shorthand-folding of `animation`/`animation-timeline`/
  `animation-range` is a standing risk for any future scroll-driven animation
  in this codebase**, not just the nav condense (Task 13) or `.reveal` (this
  session) — it already bit both. Any new rule written as separate
  `animation`/`animation-timeline` declarations should go through a `var()`
  indirection (the `--nav-timeline`/`--reveal-timeline` pattern) from the
  start, and should be checked against the actual built `dist/` CSS, not just
  source, before being trusted.
- **The plan document has a markdown fence-count bug of its own.** An odd
  number of ` ``` ` fence markers inside `docs/superpowers/plans/
  2026-09-21-ui-stylization.md`'s Task 14 section (the `.project-card`/
  `.pc-body` CSS blocks render as one unclosed fence) flips the fence-tracking
  parity for the rest of the file, which broke this plan's own task-extraction
  tooling for Task 15 (`scripts/task-brief` reported "no heading matching
  'Task 15'"). Confirmed independently in this session by reading the section
  directly. Zero effect on the shipped site — a documentation-tooling defect
  only, not fixed here (out of scope; the workaround was writing
  `task-15-brief.md` manually from previously-verified plan content).
- **The plan's own "Known gaps, stated rather than hidden" section is still
  accurate and still open**, carried forward rather than re-solved by this
  task: `tests/` is dev-only and not wired into CI (no GitHub Actions
  workflow — this is backlog item 9, now unblocked but not built); check 5 of
  spec §10 is *simulated*, not native — `tests/motion.mjs` neutralises
  `animation-timeline` with an injected stylesheet rather than running an
  engine that genuinely lacks the feature, which proves content stays visible
  without the animation but not that the `@supports` guard itself parses
  correctly in a non-supporting engine; the contact API (`CLAUDE.md`
  verification item 5) is not in the harness, still needing manual exercise
  under `wrangler pages dev` with Resend credentials; and `@property` support
  is assumed for the nav's `--logo-scale`/`--nav-pad` — where unsupported, the
  nav still works and nothing is hidden, it just stops interpolating, which is
  the same "degrade to the resting state" contract the reveals follow.
- **Nothing is pushed.** Branch `revamp`, 19 commits ahead of
  `origin/revamp`, still local only.

---

## Session 6 — 2026-09-23 — Final whole-branch review, fix wave, and a real bug in the test harness itself

### Goal

Finish a consolidated fix wave from the final whole-branch review of Session
5's completed 15-task UI stylization plan. A prior agent had already made six
files' worth of uncommitted changes (see below) before being interrupted
mid-session (accidentally stopped by the user, not a crash). Asked to: verify
that prior work rather than redo it, then complete four remaining items —
re-measure a stale contrast baseline, add a regression guard against the
`.reveal` minifier-fold bug recurring (with a break-then-restore proof it
actually works), fix a port-collision/leak hazard in the test harness's
preview-server helper, and commit the plan document (still untracked despite
the Session 5 spec referencing it by path) — then run the full clean suite and
commit.

### Decisions

**Verified the six already-uncommitted files before touching anything**, via
`git diff` against each one, matching the task's description exactly: `.hatch-cut`/`.hatch-fill`/`.reg-marks` deleted from `global.css` (dead, no
callers) with a new `@media print` block neutralizing `.reveal`/`.sweep-rect`;
two new `tests/contrast.mjs` `PAIRS` entries for `.pc-summary`/
`.pc-metric-label` over the card hover hatch; the dead
`baseline.js.bytes === 0 ||` escape hatch removed from `layout.mjs`; `Nav.astro`'s
comment corrected from "six rules" to "five"; a pointer comment added to
`ArticleCard.astro`; `test:visual`/`test:smoke` documented in `tests/README.md`.
All correct as-is; none re-done.

**Fix 1 (stale baseline) was straightforward** — rebuilt clean, ran
`test:axe`, got `1778` (down from the committed `2114`), confirmed stable
across four separate measurements before writing it in.

**Fix 2's guard was designed to fail on the exact original bug, and proven to.**
Added a check to `tests/motion.mjs` that finds a genuinely below-the-fold
`.reveal` element on `/index.html` at load (no scroll) and asserts it is
measurably not at full opacity — the only thing that actually proves the
scroll-driven timeline is running, since the existing checks only assert
content isn't *permanently* invisible, which a dead animation trivially
satisfies (it falls back to fully opaque). Proved this by literally reverting
`global.css`'s `--reveal-timeline` indirection back to the pre-`5f48d00`
broken form, rebuilding, confirming the built CSS reproduced the exact folded
shorthand (`animation:linear both reveal-in view()`), running the new check
and watching it fail with the predicted signature (`opacity=1
animationName=none` on every below-the-fold element) while the three
pre-existing checks all still passed — direct proof they would not have
caught this — then restoring the fix and confirming the guard passes again.

**Fix 3 turned into a real investigation, and the task's own framing of the
bug was wrong.** The brief described the hazard as "SIGTERM to the `npx`
wrapper doesn't reliably kill the `astro` grandchild process." Testing showed
something more specific and more interesting: Astro 7's `astro preview` does
not run its server as a child of the invoking process at all — it forks a
**self-daemonizing background process** (confirmed via `ps`: `PPID 1`, its own
session) and the `npx` wrapper this harness spawns exits almost immediately
either way (it either confirms the daemon is up, or prints "already running at
... (pid N)" and exits if one already exists). So a process-group kill of the
`npx` process — the fix a literal reading of the brief would produce — does
nothing at all; it doesn't even reach the real server. Switched the approach
entirely: `stop()` now shells out to find whatever process is actually
`LISTEN`ing on the port and kills that directly.

That surfaced a second, worse bug while debugging the first: a naive
`lsof -ti:PORT` (no socket-state filter) matches *every* socket touching that
port on **either** end — including the client side of a still-open connection
to the server. With a real browser under test, this returned three PIDs for
one running preview server: the actual daemon, plus two of the test run's own
Chromium helper processes that had made HTTP requests to it. Sending `SIGKILL`
to one of those — a live, sandboxed Chromium subprocess mistaken for "the port
owner" — was reproduced hanging the `stop()` call for minutes (long enough
that `npm run test:contrast` was killed by an external timeout, exit 137,
twice, before the cause was isolated with a series of standalone repro
scripts). This reads as a macOS signal-delivery quirk against a sandboxed
process, not a Node bug, and is worth remembering: **`lsof -ti:PORT` alone is
not a safe way to identify "the server on this port" when a browser under test
might also be talking to it.** `-sTCP:LISTEN` fixes it by restricting the match
to the bound/listening socket only. Reproduced the hang concretely, applied
the fix, then confirmed `npm run test:contrast` three times back-to-back
completes in seconds each time with the port verified empty afterward.

**Fix 7 was mechanical** — the plan doc was genuinely just untracked; added
and committed as its own commit so it's easy to find in history.

**Grouped the six-commit result by concern rather than as one giant commit**,
since the fixes are logically distinct and a future `git log` reader benefits
from that separation (dead-code/comment cleanup; baseline re-measure; the
motion regression guard with its own proof; the server-lifecycle fix with its
own investigation; the plan doc).

### Changed

- `src/components/ArticleCard.astro`, `src/components/Nav.astro`,
  `src/styles/global.css`, `tests/README.md`, `tests/contrast.mjs`,
  `tests/layout.mjs` — the six already-in-progress files, committed as-is
  (commit `74c3d6c`).
- `tests/baseline.json` — `colorContrastIncomplete` `2114` → `1778` (commit
  `253f6d0`).
- `tests/motion.mjs` — added the fourth check, "motion — reveal is genuinely
  animating (regression guard)" (commit `a8b371a`).
- `tests/lib/server.mjs` — added a pre-spawn port-collision check
  (`portIsOccupied`); rewrote `stop()` to find and kill the actual
  `LISTEN`-state process on the port via `lsof -ti:PORT -sTCP:LISTEN` instead
  of signalling the `npx` wrapper or its process group. Exported interface
  (`startPreview({ port }) -> { base, stop }`) unchanged (commit `6029662`).
- `docs/superpowers/plans/2026-09-21-ui-stylization.md` — added and committed,
  previously untracked (commit `ff08145`).
- `MEMORY.md` — this entry.

### Verified

- **Fix 1**: `lsof -ti:4321,4322 | xargs kill -9; rm -rf dist && npm run build
  && npm run test:axe` → `(measured 1778 undetermined-contrast nodes across 22
  pages × 4 renderings)`, `axe: 89/89 checks passed`. Repeated 3 more times
  (once standalone, twice inside full `npm test` runs after further code
  changes) — consistently 1778.
- **Fix 2 break-then-restore**: documented in full in
  `.superpowers/sdd/2026-09-21-ui-stylization/final-review-fixes-report.md`
  with both the failing output (`motion: 68/69`, 1 failure, listing 7
  below-the-fold elements all at `opacity=1 animationName=none`) and the
  passing output (`motion: 69/69`) after restoring the fix, plus confirmation
  via `git diff` that the restored region is byte-identical to before the
  experiment.
- **Fix 3**: reproduced the hang with standalone scripts under
  `/private/tmp/.../scratchpad/` (repro4/7/9, not committed — throwaway
  diagnostics) before and after the `-sTCP:LISTEN` fix; confirmed
  `lsof -i:4321 -sTCP:LISTEN` returns exactly the real daemon pid where plain
  `lsof -ti:4321` returned three. Post-fix: `npm run test:contrast` × 3
  consecutive runs, each passing (`30/30`) in seconds, port empty
  (`lsof -ti:4321` → nothing) after every run.
- **Full clean suite, twice** (once mid-session before final commits, once
  again afterward against the committed state): `lsof -ti:4321,4322 | xargs
  kill -9; pkill -9 -f ms-playwright; rm -rf dist && npm run verify && npm
  test`. `npm run check`: **0 errors, 0 warnings, 0 hints**, 22 pages. `npm
  test`: `axe 89/89` (1778 measured), `layout 177/177`, `contrast 30/30`,
  `interaction 39/39`, `motion 69/69` (including the new guard), `visual
  24/24`. All exit 0. `npm run test:smoke` (not part of `npm test`) run
  separately: `4/4`.
- `git status` clean after all commits; nothing uncommitted, nothing
  untracked.

### Known issues / next steps

**Carried forward, still true** (see Sessions 3/4/5 for the full list — not
re-verified this session, listed once for continuity): 11 launch placeholders
in `site.config.ts`; Google Rich Results Test never run; analytics beacon
never executed in a browser; backlog items 2/4/9 open; six articles need
P.Eng. review; `stats.projectsDelivered`/`yearsExperience` unverified; the
three human-review items (duotone taste-call, hero draw-in feel,
schedule-strip/card-detail look); `tests/` still not wired into CI; the
`animation-timeline`-unsupported simulation in `tests/motion.mjs` is still
simulated, not native; the contact API still needs manual exercise under
`wrangler pages dev` with Resend credentials; `docs/superpowers/plans/
2026-09-21-ui-stylization.md`'s own fence-count bug in its Task 14 section is
still unfixed (documentation-tooling only, zero effect on the shipped site).

**New from this session:**

- **`tests/lib/server.mjs`'s reasoning comment now documents a subtler
  failure mode than a first read of the original task brief assumed** — a
  self-daemonizing `astro preview` process, plus `lsof`'s port-matching
  including client-side connections. Both are explained at length in the
  file's own comments and in the commit message for `6029662`, precisely so a
  future session doesn't "simplify" it back toward the process-group-kill
  approach that was tried and shown not to work.
- **`astro preview`'s daemon behaviour (persists across separate CLI
  invocations, keyed by port, with its own `astro preview stop` command) is
  Astro-7-specific and wasn't previously documented anywhere in this repo.**
  If a future Astro upgrade changes this, `-sTCP:LISTEN` should keep working
  regardless (it only assumes "the server listens on the port," not any
  particular process topology), but it's worth re-checking if `stop()` ever
  stops working after a dependency bump.
- **Three standalone diagnostic scripts used to isolate the port-collision
  bug were written under this session's scratchpad directory (outside the
  repo) and were not committed** — deliberately throwaway, per the same
  reasoning Session 5 flagged about not adding permanent test scripts outside
  `tests/` without being asked.
- Full report for this session's fix wave, including both proof transcripts
  in full, is at `.superpowers/sdd/2026-09-21-ui-stylization/
  final-review-fixes-report.md`.
- **Nothing is pushed.** Branch `revamp`, now 24 commits ahead of
  `origin/revamp`, still local only.

---

## Session 7 — 2026-09-23 — The `.reveal` "no animation at all" report: not a regression, a real design ceiling, fixed

### Goal

User (via a delegated task) reported that scrolling the site under `npm run
dev` showed no visible scroll-reveal animation at all — nothing fades or
rises into view. Asked to diagnose first rather than assume a fix was
needed, per the background in Sessions 5/6 about the `.reveal` minifier-fold
bug class and the already-known "near-instant flick" trade-off.

### Diagnosis

Ruled out, in order, with direct evidence:

- **Not a browser/OS fallback.** The pinned Playwright Chromium (used to
  reproduce) reports `CSS.supports('animation-timeline', 'view()') === true`,
  and `matchMedia('(prefers-reduced-motion: reduce)').matches === false`
  (confirmed both in Playwright's default context and via `defaults read
  com.apple.universalaccess reduceMotion` on the host, which reads `0`).
- **Not the Task 13/Session 5 minifier-shorthand-folding bug recurring.**
  Computed style in both `npm run dev` and a clean `npm run build && npm run
  preview` shows `animationTimeline: 'view()'` and `animationName:
  'reveal-in'` — the `--reveal-timeline` indirection is intact and identical
  in both paths. No dev-vs-build discrepancy exists.
- **The animation genuinely runs, in both dev and preview.** Direct
  measurement (scripted via `playwright-core` against the cached Chromium,
  scrolling in small increments and reading `getComputedStyle(el).opacity`)
  showed opacity transition cleanly from 0 to 1 as a below-the-fold element
  crossed into view, in both `npm run dev` (unminified) and the built
  preview (identical result).
- **The real cause: the transition window Session 5 tuned
  (`animation-range: entry 0% entry 2%`) was ~15-18px of scroll** — narrower
  than a single mouse-wheel tick (~100px) or trackpad flick, so in ordinary
  scrolling a user skips over every intermediate frame and the element
  simply pops from invisible to fully visible. This exact concern was
  already flagged in Session 5/6's "known issues" as "a near-instant flick…
  worth revisiting… but do not loosen without re-running
  `tests/motion.mjs`'s in-viewport-on-load scenario and `tests/axe.mjs`."
  This session is that revisit, now that a real user actually hit it.

**Conclusion put to the user directly (via AskUserQuestion, since this is a
deliberate prior trade-off between visual polish and a real WCAG contrast
bug, not a mechanical bug): not a regression.** Working exactly as tuned;
the tuning itself is too conservative to be perceptible. User chose to widen
the window and re-verify, matching Session 5's original empirical method.

### What was actually constraining the width, and the fix

Re-measured (script written this session, not committed — see Known issues)
every `.reveal` element on every built page × both harness viewports
(1440×900, 390×844) that is even partially visible at scroll 0 — the set
that determines the safety ceiling, since only those can show partial
opacity on first paint. Found **exactly one** genuinely tight case
site-wide: `.card-grid.reveal` on `/insights.html` (the "more articles"
grid below the lead `ArticleCard`), poking only ~23.6px into the viewport at
1440×900 — the same element Session 5's comment already named at ~18px; the
number drifted with ordinary content edits, not a new bug. Every other
near-fold `.reveal` element site-wide had 260-456px of headroom, an order of
magnitude looser.

**Fix: took that one element out of `.reveal` entirely**
(`src/pages/insights.astro`), rather than chase a global width capped by it.
It is already ~97% on screen at load, so there was nothing worth animating
for it in the first place. With it gone, the real site-wide floor rose to
~31.5% (see below), and **`animation-range` widened from `entry 0% entry
2%` to `entry 0% entry 15%`** (`src/styles/global.css`) — roughly 2× margin
under that new floor.

**A real correction made to the codebase's own understanding of `entry`,
found while verifying the new width was actually safe.** Both the pre-existing
comment (Session 5) and this session's first draft of the replacement
comment asserted `entry`'s 0%–100% distance is a flat viewport-height figure,
independent of the subject's own height. **That is wrong.** Directly
measuring the actual per-element transition window (binary-searching the
opacity 0→1 crossing in a live browser) showed the window scales with each
element's own height: a 60px-tall `.reveal` element got an ~8-10px window
under `entry 0% entry 15%`, while a 634px-tall one got ~94px — consistent
with the real rule, `entry`'s distance = `MIN(subject height, viewport
height)`, not a shared constant. This happens to be the *right* behaviour
for the design (a small element doesn't need a long scroll to fade in; a
large structural block gets a genuinely visible graduated fade), but the
safety math has to use it: the correct ceiling per near-fold element is
`poke-in-px / MIN(elementHeight, viewportHeight)`, not `poke-in-px /
viewportHeight`. Recomputed with the corrected formula: the tightest
remaining case site-wide is `/projects.html`'s card-grid at 390×844
(poke ≈ 266px over an entry-distance of 844px, since that grid is far taller
than the viewport) → **max safe width ≈ 31.5%**, comfortably clearing the
chosen 15%. The corrected formula and the reasoning are now in
`global.css`'s comment next to `animation-range`, replacing the incorrect
one — a later session re-tuning this value should trust that comment over
the retired Session 5 wording anywhere the two would have disagreed.

### Changed

- `src/pages/insights.astro` — removed `reveal` from the article `card-grid`
  div, with a comment explaining why (poke-in distance, nothing to animate).
- `src/styles/global.css` — `.reveal`'s `animation-range` widened from
  `entry 0% entry 2%` to `entry 0% entry 15%`; the adjacent comment rewritten
  to state the corrected `entry`-distance formula and the current measured
  safety margin, replacing the incorrect height-independence claim.
- `MEMORY.md` — this entry.

### Verified

From a clean state (`lsof -ti:4321,4322 | xargs kill -9`, `pkill -9 -f
ms-playwright`, `rm -rf dist`), all under `nvm use` (Node 22.12.0):

- `npm run check` — **0 errors, 0 warnings, 0 hints**, 23 files.
- `npm run build` — 22 pages, clean.
- `npm test` (`build && test:axe && test:layout && test:contrast &&
  test:interaction && test:motion && test:visual`) — **all green, same
  numbers as the last recorded Session 6 run**: axe 89/89 (1778
  undetermined-contrast, unchanged), layout 177/177 (shipped JS 2087 bytes,
  unchanged — still CSS-only), contrast 30/30, interaction 39/39, motion
  69/69 (including the Session 6 "genuinely animating" regression guard;
  reveal count correctly dropped from 17 to 16 site-wide after removing the
  one element), visual 24/24. No baseline number needed re-measuring.
- `npm run test:smoke` (not part of `npm test`) — 4/4.
- Directly re-confirmed the accessibility invariant the whole change turns
  on: `tests/motion.mjs`'s "in-viewport on load" section (opacity ≥ 0.99 for
  every `.reveal` element visible at scroll 0, on every page × both harness
  viewports, plus the `/services.html#stormwater` deep-link case) passed
  with the widened range — this is the actual ground-truth check that the
  new width doesn't reintroduce Session 5's original contrast bug, not just
  the manual poke/height arithmetic above.
- `git status` clean after verification; only the two source files listed
  above are modified, nothing untracked.

### Known issues / next steps

- **Not committed.** `CLAUDE.md` says commit only when the user asks; they
  had not at the time of writing.
- **Diagnostic and measurement scripts used this session
  (`diagnose-scratch.mjs`, `measure-poke.mjs`, `measure-poke2.mjs`) were
  written at the repo root to get `node_modules` resolution, used, and then
  deleted** — deliberately throwaway, same reasoning Sessions 5/6 gave for
  not adding permanent scripts outside `tests/` unasked. If a future session
  wants "re-measure the site-wide floor" to be a real command instead of
  hand-written each time, that would be a reasonable, small addition to
  `tests/` — not done here.
- **The widened range was verified against exactly the harness's two
  viewports (1440×900, 390×844), the same scope every prior session's
  verification used.** A real device at some other viewport height could in
  principle expose a different near-fold element as the tight case; this is
  a pre-existing limitation of the testing scope, not new to this session's
  change (the 2% value was only ever verified the same way).
- **The visual *feel* of the widened reveal was not re-reviewed by a human.**
  This session confirmed, by direct measurement, that the transition window
  is now large enough on real structural blocks (58-94px, several times the
  old 8-18px) to plausibly read as a real fade during normal scrolling, and
  that no element shows partial opacity at load — but nobody watched it
  scroll. This sits alongside the three human-review items already open
  since Session 5 (duotone taste-call, hero draw-in feel, schedule-strip
  look) — add "does the reveal actually look graduated now" to that list.
  If a future session wants an even more graduated feel, re-measure the
  site-wide floor first (see the comment in `global.css`) rather than
  guessing — the constraint is real and page content shifts it over time.
- Everything else carried forward from Session 6 is unchanged and not
  re-verified here: 11 launch placeholders, Google Rich Results Test never
  run, analytics beacon never executed in a browser, backlog items 2/4/9,
  six articles needing P.Eng. review, unverified stats, `tests/` not wired
  into CI, the `animation-timeline`-unsupported simulation still simulated
  rather than native, the contact API still needing manual exercise under
  `wrangler pages dev`, and the plan document's own fence-count bug.
- **Still not pushed.** Branch `revamp`.

---

## Session 8 — 2026-09-23 — Reveal motion made obvious (taste iteration), and a hero background video

### Goal

Direct continuation of Session 7, same conversation. Two pieces of work: (1)
the user watched the widened `.reveal` fade live and iterated on how it
*feels* several rounds — this is the human-review item Session 7 flagged as
still open, now actually resolved by a human looking at it; (2) a new
request to add a full-bleed background video to the homepage hero, keeping
the existing SVG cut/fill diagram.

### Part A — `.reveal`'s motion, iterated live

Session 7 left the mechanism *correct* (proven with a live opacity trace —
see that entry) but the feel unreviewed. This session's rounds, each shipped
and verified before moving to the next:

1. **14px → 28px `translateY`.** Still reported "way too subtle."
2. **28px → 48px `translateY` + `scale(0.96)`.** Fixed the "too subtle"
   complaint, but the user's *next* request ("more of a natural fade in")
   was implicitly a complaint about this round: scaling text in and out
   looks artificial — sub-pixel rendering makes it look soft/blurry for the
   wrong reason (an unintentional side effect, not a deliberate soft-focus
   choice).
3. **48px+scale → 32px `translateY`, `linear` → `var(--ease)`.** Dropped the
   scale, moderated the rise, switched to the site's one shared easing token
   (`tokens.css`: `cubic-bezier(0.2, 0, 0.1, 1)`, used everywhere else
   motion happens) so a scroll-linked timeline remaps *progress* through
   that curve instead of climbing linearly. The user's follow-up ("no i
   meant transition as in a fade in... make it more obvious") clarified
   they'd read the previous ask as being about position/easing, but meant
   the opacity fade itself needed to be more obvious.
4. **Added `filter: blur(8px) → blur(0)` alongside the existing translateY +
   opacity.** Final state. Plain opacity is a weak signal on its own (it
   only changes how much you can see through something); pairing a
   blur-to-sharp resolve with the fade and rise is the standard
   "materialize" combination and is what actually reads as an obvious yet
   natural fade, per direct visual confirmation against the live dev
   server. Text is only ever blurred mid-scroll, never at rest.

**Every round was verified with the full suite before moving to the next**
(`npm run check` 0/0/0, `npm test` all green, same numbers each time:
axe 89/89, layout 177/177, contrast 30/30, interaction 39/39, motion 69/69,
visual 24/24) and the built CSS was re-checked each time for the
minifier-shorthand-fold regression (`grep animation-timeline:var(--reveal-timeline) dist/_astro/*.css`)
since the `animation` shorthand declaration was touched (linear → var(--ease)).
It never folded — the `--reveal-timeline` indirection from Sessions 5/6
covers the easing-function change fine, since the risk is specifically
`animation-timeline` being inlined into the shorthand, not the timing
function.

**Current state, for a future session:** `.reveal`'s keyframes are
`translateY(32px) + blur(8px) + opacity: 0` → resting, over `entry 0% entry
15%` (Session 7) with `var(--ease)` timing (this session). If asked to tune
this further, read Session 7's `global.css` comment for the *scroll-distance*
constraint (the WCAG-driven ~31.5% ceiling) before touching
`animation-range`, and know that `translateY`/`blur` amplitude has no such
ceiling — those are the tuned-by-eye levers, not the accessibility-limited
one.

### Part B — Hero background video

**Classified architectural** (per `superpowers:brainstorming`): no video
pipeline existed anywhere in this repo, so per that skill's own bounded/
architectural test ("if there is no existing flow to change, the task is
not bounded"), this wasn't bounded regardless of how contained the final
diff turned out to be. Given the actual footprint stayed to one page's hero
with no new interfaces or restructuring, ceremony was scaled down —
clarifying questions and a short in-chat design, approved by the user,
rather than a written spec doc + `writing-plans`. Flagged directly before
building: Session 3 deliberately avoided a photo/footage-led hero because no
real project footage existed, choosing the abstract drawing-sheet language
instead partly for that reason — this is a real departure from that call.
The user was told this plainly and chose to proceed anyway; not re-litigated
here, just recorded so a later reader knows it was a conscious trade, not an
oversight.

**No video-generation tool was available this session** (no Sora/Veo/Runway
integration). Told the user this directly rather than pretending otherwise.
User chose stock footage.

**Asset: Pexels "A Drone Shot Over a Construction Site" by Jozef Papp**
(`https://www.pexels.com/video/a-drone-shot-over-a-construction-site-4205680/`),
Pexels License — free for commercial use, no attribution required (credited
here anyway, for the record). An aerial drone shot of an excavator working
an earthworks site; thematically near-identical to the existing
`mass-earthworks-overhead.jpg`/`earthworks-cut-fill.jpg` stock photos
already on the site, so it extends an existing pattern rather than
introducing a new visual register. Source is genuinely 4K (3840×2160,
29.12s, 88.6 MB) — confirmed by downloading and probing with `ffprobe`.

**Not served at 4K.** Serving the raw 88.6 MB source would have badly
regressed the site's core performance principle (Session 1: near-zero
weight, built for contractors on mid-range Android over spotty LTE). Instead:
downloaded the 1080p rendition (20.1 MB) as an encoding source, trimmed to a
10s loop (`ffmpeg -ss 2 -t 10`), scaled to 1280×720, stripped audio, and
re-encoded to both formats (`ffmpeg` installed via `brew install ffmpeg` —
not previously on this machine; a reversible, standard dev-tool install,
done and reported rather than asked about first since it's low-risk and
directly served the explicit request):

- `public/video/hero-earthworks.mp4` — H.264, `-crf 28 -preset slow`, 1.02 MB
- `public/video/hero-earthworks.webm` — VP9, `-crf 34 -b:v 0`, 0.79 MB
- `src/assets/images/hero-earthworks-poster.jpg` — poster/fallback frame,
  routed through Astro's normal `astro:assets` `<Image>` pipeline (unlike
  the video files, which can't go through that pipeline and live in
  `public/` as static files) — built output generates responsive WebP
  variants at 52–153 KB depending on breakpoint, versus the 211 KB source
  JPEG.

Total hero media payload: ~0.8–1 MB (video) + tens of KB (poster), against
an 88.6 MB raw 4K source — roughly a 90x reduction, and still comparable to
a single unoptimized large photo.

**Contrast, verified two ways, not just asserted:**

1. **Analytically, in advance.** Measured the actual clip's luminance with
   `ffmpeg`'s `signalstats` filter across every frame of the final loop:
   average frame luma never exceeds ~96/255 (~38%) — a dark, earth-toned
   scene, small isolated highlights aside (`YMAX` does hit 255 in a few
   pixels — stray reflective debris, not a sustained region). Computed the
   pathological case anyway: blending the chosen scrim
   (`color-mix(in srgb, var(--bg-invert) 85%, transparent)`, flat — not a
   gradient, deliberately, so the same bound holds everywhere in the hero,
   not just wherever a gradient happens to be darkest) against a
   *hypothetical pure-white pixel* (255,255,255), far brighter than
   anything the real footage ever sustains, and computing WCAG relative
   luminance/contrast by hand: `--text-invert` (#f2f1ec) against that
   worst-case blended background still lands at ~10:1 — comfortably past
   AA (4.5:1) and past AAA (7:1), with real margin, before the actual
   (never-that-bright) footage is even considered.
2. **Empirically, after.** `npm run test:axe` reported the expected
   `colorContrastIncomplete` increase (1778 → 1792, +14 — all four homepage
   renderings, ~3–4 nodes each) because axe cannot analyze contrast over a
   video/image background, the exact same bookkeeping category already
   established in Sessions 4/5/6 for `background-image` elements. **Zero
   real violations** — all four `axe — {light,dark} @ {1440x900,390x844}`
   sub-checks (which assert `violations.length === 0`) passed clean; only
   the baseline-increase tripwire fired, as designed. Re-measured
   `tests/baseline.json` in the same commit per the established protocol
   (Session 4's rule: never silently, always with the reason — recorded
   here).

**A real bug found and fixed before any of this could be verified: `.hero-diagram`
was silently unstyled.** `SectionDiagram` is a child component; its root
`<figure>` only carries *its own* component's scoped `data-astro-cid`
attribute, never `index.astro`'s. A plain (Astro-scoped) `.hero-diagram { … }`
rule written in `index.astro`'s `<style>` block compiles to
`.hero-diagram[data-astro-cid-<index's-hash>]`, which never matches that
element — the browser silently accepts the rule and applies nothing.
Concretely: `position: relative; z-index: 1` never took effect, so the
diagram (default `position: static`, `z-index: auto`) painted *behind*
`.hero-media` (which is `position: absolute`) per ordinary CSS stacking
rules (positioned elements paint after non-positioned ones regardless of
DOM order) — the entire cut/fill diagram was invisible, fully hidden by the
video, on the first build. Caught by actually screenshotting the built page
rather than trusting `astro check` (which had nothing to say about this —
it's a scoping/specificity issue, not a type error) — the diagram's
`getBoundingClientRect()` reported a real, correctly-laid-out box, which is
what made it non-obvious from computed layout alone; only a real screenshot
or `getComputedStyle().position` showed the rule wasn't applying. Fixed
with Astro's `:global()` escape hatch: `:global(.hero-diagram) { position:
relative; z-index: 1; }`. **This is a real, previously-undocumented Astro
gotcha for this codebase** — any future page-level style meant to affect a
child component's root element by class needs `:global()`, or it silently
no-ops. Worth adding to `CLAUDE.md`'s gotcha list if this pattern comes up
again.

**A second, minor bug**: the initial markup included `fetchpriority="low"`
on the `<video>` (to deprioritize it behind critical text/CSS during load).
Astro's built-in JSX-style types don't include `fetchpriority` on
`VideoHTMLAttributes` in this Astro version, so `astro check` correctly
failed at 1 error. Dropped the attribute rather than fighting the type
system for a nice-to-have hint with no functional loss.

**Accessibility mechanism, CSS-only, matching the site's established
pattern** (no JS added — `layout.mjs`'s shipped-JS baseline stayed at 2087
bytes, unchanged): the hero carries both a `<video autoplay muted loop
playsinline poster={...}>` and a plain `<Image>` poster, absolutely
positioned on top of each other; `.hero-media-poster { display: none; }` by
default, flipped under `@media (prefers-reduced-motion: reduce)` (video
hidden, poster shown) — the same show/hide-under-reduced-motion shape
`.reveal` already uses, just without a `@supports` half since there's no
feature-detection question here (video support itself degrades natively via
the `poster` attribute and the nested `<source>` fallback chain, not via a
CSS guard).

### Changed

- `src/styles/global.css` — `.reveal`'s `animation` timing (`linear` →
  `var(--ease)`) and keyframes (`translateY(14px)` → `translateY(32px) +
  filter: blur(8px)`, through the two intermediate rounds recorded above).
- `src/pages/index.astro` — hero restructured: new `.hero-media` video/poster
  layer (video + `<Image>` fallback + scrim), `position`/`z-index` stacking
  fixes for `.hero-media` and its siblings (including the `:global()` fix
  for `.hero-diagram`), new imports (`astro:assets` `Image`, the poster
  asset).
- `public/video/hero-earthworks.mp4`, `public/video/hero-earthworks.webm` —
  new, static (not Astro-optimized) video assets.
- `src/assets/images/hero-earthworks-poster.jpg` — new, Astro-optimized
  poster/fallback image.
- `tests/baseline.json` — `colorContrastIncomplete` `1778` → `1792`.
- ffmpeg installed via Homebrew on this machine (not a repo change, noted
  for whoever next runs the video-encoding steps above on a fresh machine).
- `MEMORY.md` — this entry.

### Verified

From a clean state (`lsof -ti:4321,4322 | xargs kill -9`, `pkill -9 -f
ms-playwright`, `rm -rf dist`), all under `nvm use` (Node 22.12.0), **after**
the `.hero-diagram` `:global()` fix and the baseline re-measure:

- `npm run check` — **0 errors, 0 warnings, 0 hints**, 23 files.
- `npm run build` — 22 pages, clean; Astro generated 5 responsive WebP
  variants of the poster automatically.
- `npm test` — **all green**: axe 89/89 (1792 undetermined-contrast,
  re-measured and justified above), layout 177/177 (shipped JS 2087 bytes,
  unchanged), contrast 30/30, interaction 39/39, motion 69/69, visual 24/24.
- `npm run test:smoke` — 4/4.
- **Visual confirmation via Playwright screenshots** (not just automated
  assertions) at 1440×900 and 390×844, light and dark, and under
  `reducedMotion: 'reduce'`: hero text legible over the video in every case;
  cut/fill diagram fully visible and correctly layered on top after the
  `:global()` fix; reduced-motion context confirmed via
  `getComputedStyle` — video `display: none`, poster `display: block`.
- `git status` clean of stray files; only the intended paths are
  modified/new (`public/video/`, the new poster, `index.astro`,
  `global.css`, `tests/baseline.json`, `MEMORY.md`).

### Known issues / next steps

- **Not committed.** `CLAUDE.md`: commit only when asked; not asked yet.
- **The `:global()` scoping gotcha found in Part B is new and not yet added
  to `CLAUDE.md`'s numbered gotcha list** — recorded here in full instead.
  A future session touching cross-component styling from a page's own
  `<style>` block should add it there if it comes up again.
- **The video's loop point is a hard cut, not a crossfade** (10s trimmed
  from a continuous 29s shot, no blending at the seam). Standard practice
  for a background element that is never the focal point, and not treated
  as a defect, but worth knowing if a future session wants to polish it
  further — would need either a longer loop or an actual crossfade encode.
- **Autoplay-with-audio browser policies weren't a concern here** (video has
  no audio track — stripped during encoding), but if a future session
  swaps in footage that does have audio, muted autoplay must be preserved
  or some browsers will simply refuse to autoplay at all.
- **Real-device battery/data-usage impact of an autoplaying hero video was
  not measured** — only byte size and axe/contrast were verified. The
  target audience (Session 1: contractors on mid-range Android, spotty LTE)
  is exactly the group most sensitive to this; worth a real-device check
  before launch, not just a desktop-browser one.
- Everything carried forward from Session 7 is unchanged and not
  re-verified here: 11 launch placeholders, Google Rich Results Test never
  run, analytics beacon never executed in a browser, backlog items 2/4/9,
  six articles needing P.Eng. review, unverified stats, `tests/` not wired
  into CI, the contact API still needing manual exercise under `wrangler
  pages dev`.
- **Still not pushed.** Branch `revamp`.

---

## Session 9 — 2026-09-23 — Higher-quality hero video, and a staggered hero load-in

### Goal

Direct continuation of Session 8, same conversation, two follow-up requests
against the just-shipped hero: (1) "make the title card text also animate in
... lag in time ... title first, then description, then buttons"; (2) "make
the video higher quality."

### Part A — Video quality

Session 8's shipped encode was deliberately conservative: 1280×720, H.264
CRF 28 / VP9 CRF 34, chosen for weight (≈1–0.8 MB) over fidelity, from a
1080p source that was itself downscaled from the true 4K original. Re-encoded
from the still-available 1080p source (no need to re-fetch the 4K original)
at three candidate quality tiers before picking one, each from the *same* 10s
trim so only resolution/CRF varied:

| Tier | Resolution | H.264 CRF | MP4 size | VP9 CRF | WebM size |
|---|---|---|---|---|---|
| Shipped (Session 8) | 1280×720 | 28 | 1.02 MB | 34 | 0.79 MB |
| "hq" (rejected) | 1920×1080 | 20 | 7.32 MB | 28 | 3.86 MB |
| **"mid" (shipped)** | **1920×1080** | **24** | **4.44 MB** | **32** | **2.41 MB** |

Picked the middle tier deliberately, not the highest-quality one: a real,
visible resolution doubling (720p → 1080p) is the change that actually
reads as "higher quality" on a background element partly obscured by the
85% scrim and hero text — the extra fidelity CRF 20 buys over CRF 24 is much
harder to perceive under that scrim, for roughly 65% more bytes. `<source>`
order in the markup still lists WebM first, so any browser that supports it
(most current ones) loads the 2.41 MB file; the 4.44 MB MP4 is the
Safari-without-VP9-support fallback path, not the common case. Still a real
weight increase over Session 8 (roughly 2.4–4.3×, depending on which
`<source>` a given browser picks) against the site's stated
mid-range-Android/spotty-LTE performance principle — recorded plainly here
rather than glossed over, not re-litigated since the user asked for this
specific trade-off directly.

Poster image regenerated to match at 1920×1080 (`ffmpeg -q:v 2`, 500 KB
source JPEG; Astro's `astro:assets` pipeline generates its own responsive
WebP variants from it at build time, same as Session 8). The `<Image>`
component's explicit `width`/`height` props were updated from `1280×720` to
`1920×1080` to match the new source file's real dimensions — Astro doesn't
error on a mismatch here (both are 16:9, so no distortion either way), but
leaving the old, now-wrong values in would have been a latent inconsistency
for no reason.

### Part B — Staggered hero load-in

**New, separate mechanism from `.reveal` — deliberately.** `.reveal`
(global.css) is scroll-position-driven (`animation-timeline: view()`),
which only makes sense for content that starts below the fold; the hero's
title/lead/actions/caption are the first thing on the page and are already
in the viewport at scroll 0, so there is no scroll position for a
view-timeline to key off. Built as a plain wall-clock `animation-delay`
cascade instead, reusing `.reveal`'s own `reveal-in` keyframe (opacity +
32px rise + blur(8px)→blur(0)) and `var(--ease)` timing for the same visual
language:

```
.hero-title    animation: reveal-in var(--dur-slow) var(--ease) both;              /* delay 0 */
.hero-lead     animation: reveal-in var(--dur-slow) var(--ease) 120ms both;
.hero-actions  animation: reveal-in var(--dur-slow) var(--ease) 240ms both;
.hero-caption  animation: reveal-in var(--dur-slow) var(--ease) 480ms both;
```

`--dur-slow` is 420ms, so the full cascade settles by ~900ms (caption starts
at 480ms, finishes at 900ms). No `animation-timeline` property appears
anywhere in this declaration, so none of it carries the shorthand-folding
risk documented next to `--reveal-timeline` — that bug is specifically about
`animation-timeline` being inlined into the `animation` shorthand by the
production minifier, and there is no such property here to inline.
`prefers-reduced-motion: reduce` is respected for free via global.css's
existing blanket `animation-duration: 0.01ms !important` override — the
same mechanism the hero diagram's own load-in animation already relies on;
no new guard was needed.

**Verified the cascade is a real, ordered sequence, not just four
simultaneous fades** — sampled `getComputedStyle(el).opacity` for all four
elements every ~40ms across the first 1.2s of a fresh page load. Confirmed:
title reaches full opacity by ~490ms while lead is still at ~0.15–0.9,
actions doesn't start moving until ~360ms, caption doesn't start until
~610ms — a genuine staggered cascade, each element's fade-in window
overlapping the next's start rather than four things happening at once.

**A real risk investigated before trusting this, not assumed away**: this is
the *first* non-scroll-driven, wall-clock CSS animation on visible-at-load
content in this codebase. `tests/axe.mjs` calls `page.goto(url, {waitUntil:
'load'})` then runs axe with **no explicit extra wait** — if axe happened to
sample the page mid-cascade, it would see genuinely lower-contrast
blended/blurred text (not merely "indeterminate," the same bucket a
background-image causes, but a real, computable, potentially-failing
contrast ratio), which is exactly the shape of bug this codebase has hit
before via `.reveal`. Checked empirically rather than reasoning about it in
the abstract: ran `test:axe` five times in a row (once initially, four more
back-to-back afterward) against the shipped state — **89/89 every time, 0
violations every time**. The reason it's reliably safe in practice: `page
.addScriptTag` (injecting the axe-core bundle) plus `axe.run()`'s own DOM
traversal reliably take longer in wall-clock time than the ~900ms cascade,
so by the time axe actually samples computed styles, the animation has
already settled. This is a real timing dependency, not a structural
guarantee — flagged here explicitly (rather than left implicit) so a future
session that shortens `--dur-slow`, or upgrades to a faster axe-core that
completes its setup quicker, knows to re-verify this specific assumption
rather than assume it still holds silently. Also ran `tests/layout.mjs` and
`tests/interaction.mjs` (neither adds extra waits before checking the
homepage either) as part of two full-suite runs — no failures in either.

### Changed

- `public/video/hero-earthworks.mp4`, `public/video/hero-earthworks.webm` —
  replaced with the 1920×1080 "mid" encode (4.44 MB / 2.41 MB).
- `src/assets/images/hero-earthworks-poster.jpg` — replaced with a matching
  1920×1080 source.
- `src/pages/index.astro` — `<Image>` `width`/`height` updated to
  1920×1080; `.hero-title`/`.hero-lead`/`.hero-actions`/`.hero-caption` each
  gained a staggered `animation` declaration (new comment block explains
  why this is a separate mechanism from `.reveal`).
- `MEMORY.md` — this entry.
- `tests/baseline.json` — **not changed this session**; the measured
  `colorContrastIncomplete` count after these changes (1781, confirmed
  stable across multiple runs) sits comfortably under the existing
  committed ceiling of 1792 from Session 8, so no re-measure was needed.

### Verified

From a clean state (`lsof -ti:4321,4322 | xargs kill -9`, `pkill -9 -f
ms-playwright`, `rm -rf dist`), under `nvm use` (Node 22.12.0):

- `npm run check` — **0 errors, 0 warnings, 0 hints**.
- `npm run verify` (`check && build`) — clean, 22 pages.
- `npm test`, run twice in full from clean state: **all green both times**,
  identical numbers each run — axe 89/89, layout 177/177, contrast 30/30,
  interaction 39/39, motion 69/69, visual 24/24.
- `npm run test:axe` specifically, run 5 times total across the session
  (see Part B) — 89/89 and 0 violations every time, to build real confidence
  against the timing dependency identified above, not just a single pass.
- **Visual confirmation via Playwright screenshots**, not just automated
  assertions: captured the hero ~200ms after load (title sharp, lead
  mid-fade, actions barely started, diagram mid-draw — a genuine cascade,
  visually) and again after settling (everything sharp, full opacity). The
  1080p quality bump is visibly sharper in the captured frames versus
  Session 8's 720p screenshots — finer texture detail in the dirt/material
  piles.
- `git status` clean of stray files — only the intended paths touched.

### Known issues / next steps

- **Not committed.** Still waiting on the user to ask, per `CLAUDE.md`.
- **The axe-timing safety margin documented in Part B is real but implicit**
  — nothing in the test harness *enforces* that axe's setup overhead exceeds
  the hero cascade's ~900ms; it currently just reliably does. If a future
  session tightens the animation timing, speeds up the test harness, or
  upgrades axe-core, this specific check should be re-run, not assumed.
- **The video's overall weight increased materially this session** (roughly
  2.4–4.3× depending on which `<source>` a browser picks) in direct trade
  for visible quality, at the user's explicit request — flagged in Part A,
  not silently absorbed. Worth a real-device check on the target audience's
  actual hardware/connections before launch, same open item Session 8 already
  flagged and still unresolved.
- Everything else carried forward from Sessions 7/8 is unchanged and not
  re-verified here.
- **Still not pushed.** Branch `revamp`.
