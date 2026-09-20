# M&Z Design Consulting

Marketing and lead-generation site for a civil engineering consultancy working in
Alberta and British Columbia.

Astro 7 + TypeScript, static output, with one Cloudflare Pages Function handling
contact enquiries.

```bash
nvm use            # Node 22.12+ required
npm install
npm run dev        # http://localhost:4321
```

**Read [`docs/TODO-BEFORE-LAUNCH.md`](docs/TODO-BEFORE-LAUNCH.md) first** — the
site renders visible placeholders for business details that still need filling
in. [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) covers hosting and the contact
form.

---

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Dev server with hot reload. No contact function. |
| `npm run dev:full` | Build + serve through Wrangler, including `/api/contact`. |
| `npm run build` | Static build to `dist/`. |
| `npm run preview` | Serve the built output. |
| `npm run check` | TypeScript + content schema check. |
| `npm run verify` | `check` then `build`. Run before pushing. |
| `npm run deploy` | Build and deploy to Cloudflare Pages manually. |

---

## Layout

```
src/
  site.config.ts        ← every business detail, in one place
  content.config.ts     ← Zod schemas for projects and articles
  content/
    projects/*.md       ← 9 projects
    insights/*.md       ← 6 technical articles
  components/
    SectionDiagram.astro  ← the cut/fill hero drawing
    TitleBlock.astro      ← footer, built as a drawing title block
    Nav.astro  Logo.astro  ProjectCard.astro  ArticleCard.astro
    PageHeader.astro  CtaBand.astro  Todo.astro
  layouts/Base.astro    ← head, SEO, JSON-LD, skip link
  pages/                ← routes; [...slug] files generate detail pages
  styles/
    tokens.css          ← colour, type, spacing, motion tokens
    global.css          ← reset, primitives, buttons
  assets/images/        ← source photos; Astro generates responsive variants
functions/api/contact.ts  ← Cloudflare Pages Function
public/                 ← favicon, OG image, robots, _headers, _routes.json
```

---

## Design

The visual language is taken from civil engineering drawings rather than from a
UI framework, on the reasoning that a contractor recognises a drawing set
instantly and it is a language no competitor in this market is using.

**Colour — "Cut & Fill".** Graphite `#15181B` on drafting vellum `#EBEBE5`, with
survey-lath orange `#C2410C` reserved for calls to action and the cut hatch.
Blue-grey `#4A5A61` carries secondary text and hairlines. The orange exists in
three variants because one hex cannot clear WCAG AA on both light and dark
grounds; `tokens.css` notes which ratio each one is for.

**Type.** Archivo (industrial grotesque) for display, IBM Plex Sans for body, IBM
Plex Mono for real measured values only — elevations, chainages, quantities,
where tabular figures matter. Self-hosted via Fontsource, so there is no
third-party request blocking first paint.

**The hero** is an inline SVG cross section: existing ground crossing the
proposed design grade, cut hatched above, fill below. The geometry is solved so
the surfaces cross exactly at the region boundaries. About 4 KB, no JavaScript,
sharp at any density.

**The footer** is a drawing title block. That is what makes the contact details
and permit numbers structurally load-bearing instead of an afterthought — the
previous site had neither on any page.

**Motion** is one orchestrated moment: the design line draws itself through the
existing ground on load, then the hatching resolves. Nothing animates on scroll.
`prefers-reduced-motion` is respected.

Dark mode inverts the banding rather than flattening it: the page ground goes
deep graphite and the "dark" bands become lighter than it, so the rhythm of the
layout survives.

---

## Content

Projects and articles are Markdown with schemas enforced at build time
(`src/content.config.ts`). An invalid category or a missing summary fails
`npm run build` instead of rendering something broken.

Adding a project means writing one `.md` file. It joins the index, gets its own
page, enters the sector filter with a correct count, and appears in the sitemap.

---

## Accessibility

Verified with axe-core across all 9 pages × 2 viewports × light and dark: **0
violations** (WCAG 2.0/2.1/2.2 A + AA, plus best-practice rules).

Specifically: visible focus rings on a hue that is not the brand orange, so a
focus ring never reads as a hover state; skip link; `aria-current` on the current
nav item marked by an underline rather than colour alone; the FAQ built on native
`<details>` so it works without JavaScript; form errors shown inline, tied to
their field with `aria-describedby`, plus a focusable error summary that links to
each invalid field; the project filter announces its result through a live
region; 44px minimum touch targets.

---

## Performance

| | Before | After |
|---|---|---|
| Homepage HTML | 3.7 MB | 40 KB (8 KB gzipped) |
| Total page weight across the site | 26 MB | ~5 MB, cached and shared |
| JavaScript shipped | ~2 KB inline, broken on one page | ~2 KB, three small islands |
| Images | 7 unique, base64-inlined 75× | 7 files, responsive WebP, cached |

The old site inlined the same seven images as base64 data URIs on every page that
used them. Deduplicating them to real files is where most of the reduction comes
from.
