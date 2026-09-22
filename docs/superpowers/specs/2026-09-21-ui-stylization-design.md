# UI stylization — enriching the drawing-sheet language

**Date:** 2026-09-21
**Status:** approved design, not yet implemented.
**→ Read [§13](#13-open-decisions--answer-before-starting) first.** Three
decisions need answers before any code is written; one of them (the nav) has
ripple beyond this spec.
**Scope:** visual treatment only. No content, routing, schema or form changes.

---

## 1. Purpose

The site's visual language works but reads sparse. The ask was a more stylized
UI, with PCL and Stantec as references.

This spec raises the production values of the **existing** drawing-sheet
language rather than replacing it. Palette, type families and surface rules stay
exactly as they are; what changes is scale, depth, rhythm, imagery treatment and
motion.

## 2. Direction chosen, and what was rejected

Three directions were put to the user. They chose the first.

| Direction | Outcome |
|---|---|
| **Enrich the drawing-sheet language** | **Chosen.** No identity spent, no new assets required. |
| Big-firm structure, M&Z identity | Rejected — depends on photography that does not exist yet. |
| Full corporate AEC reskin | Rejected — would override the design decisions in `MEMORY.md`. |

**Why the references are not being copied literally.** A fetch of
`stantec.com` returned: *full-width hero photograph, 2800×1640, sparse, minimal
chrome, imagery as the primary compositional element.* `pcl.com` returned no
usable visual signal (WebFetch strips to text). What makes those sites look
expensive is **photography of real projects at scale**. M&Z has seven stock
images carried from the old site, one of which is 289×175. Adopting a photo-led
structure without the photographs produces a worse result than the current
design, not a better one — a large empty hero holding a soft stock image reads
as an abandoned template.

Accordingly, this spec treats imagery as **supporting**, and includes a
treatment (§6) that makes seven mismatched stock photos read as one system.

## 3. Constraints

Binding, from `CLAUDE.md` and the verification baseline:

1. `npm run verify` stays at **0 errors, 0 warnings, 0 hints**.
2. axe-core stays at **0 violations**, every page × {1440×900, 390×844} ×
   {light, dark}, against `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa,
   best-practice`. This is visible UI, so unlike the previous session the full
   sweep is mandatory, not optional.
3. Total JS stays at roughly **2 KB**. Every addition here is CSS-only.
4. The three orange variants (`--cut`, `--cut-text`, `--cut-light`) are not
   consolidated. `tokens.css` records which ratio each clears.
5. Dark mode has parity. Any new dark ground sets `--muted-ink` (gotcha #4) and
   an explicit `color` (gotcha #2).
6. No horizontal overflow at 390px.
7. The hero diagram's solved geometry (crossings at x=281.5 and x=684) is not
   altered. Motion may animate its strokes; it may not move its points.

## 4. Typography

Archivo is loaded as a variable font with a weight axis the site currently does
not use — every heading is 700.

**New tokens in `tokens.css`:**

```css
--t-4xl: 3.75rem;   /* 60px */
--t-5xl: 4.75rem;   /* 76px */
--wt-display: 800;  /* h1, h2 */
--wt-heading: 700;  /* h3, h4 — unchanged from today */
```

**Changes in `global.css`:**

| Element | From | To |
|---|---|---|
| `h1` | `clamp(2.5rem, 6.5vw, 4.25rem)`, 700, `-0.035em` | `clamp(2.5rem, 7.5vw, 5.5rem)`, 800, `-0.04em` |
| `h2` | `clamp(1.875rem, 4vw, 3rem)`, 700, `-0.03em` | `clamp(1.875rem, 4.5vw, 3.5rem)`, 800, `-0.032em` |
| `h3`, `h4` | unchanged | unchanged |

**The `clamp()` minimum deliberately does not move.** Only the upper bound
grows. Raising the floor is the most likely way to reintroduce horizontal
overflow at 390px, and the editorial effect is wanted on desktop, where there is
room for it. Body type and the 16px floor are untouched.

## 5. Depth layer — drawing devices

New utility classes in `global.css`. All are decorative: implemented as
pseudo-elements or on elements carrying `aria-hidden="true"`, so none of them
reach the accessibility tree.

**New tokens:**

```css
--grid-size: 32px;
--grid-line: color-mix(in srgb, var(--line) 50%, transparent);
--hatch-gap: 7px;
```

| Class | What it is | Where it is used |
|---|---|---|
| `.sheet-grid` | Faint drafting grid, two `repeating-linear-gradient`s at `--grid-size` | Inset bands as a background wash |
| `.hatch-cut` / `.hatch-fill` | 45° hatch at `--hatch-gap`, in `--cut` / `--fill` at low alpha | Section header accents, card hover |
| `.reg-marks` | L-shaped corner ticks via `::before`/`::after` + corner gradients | Card and section corners |
| `.chainage` | Tick strip, **ticks only — no numerals** | Divider under the hero and between major sections |
| `.match-line` | Dashed rule with a centred mono label | Between major sections |

**`.chainage` carries no numbers.** The obvious version of this device prints
station values (`0+000`, `0+100`) along the rule. It must not. `global.css`
reserves monospace for real measured values and states that it "is never used
for decorative labels", and invented chainages on a marketing page are decorative
labels wearing the costume of survey data — a bad look specifically for an
engineering firm. The device is tick geometry only. If a real measured value is
ever available for a given rule, it may carry that.

**Contrast rule.** The grid wash sits behind text on `.band-inset`. Its alpha
must be tuned so that body text on that band still clears 4.5:1 against the
*darkest* point of the wash, not its average. This is measured during
verification, not eyeballed.

## 6. Imagery — unified duotone

The highest-leverage change available without new assets, and the one most
likely to be a matter of taste.

All project and article imagery renders in a graphite duotone and returns to
full colour on hover/focus.

```css
.pc-img {
  filter: grayscale(1) contrast(1.08) brightness(0.96);
  transition: filter var(--dur-slow) var(--ease);
}
.pc-media::after {           /* tint layer */
  content: '';
  position: absolute;
  inset: 0;
  background: var(--duotone-wash);
  mix-blend-mode: color;
  pointer-events: none;
  transition: opacity var(--dur-slow) var(--ease);
}
.project-card:hover .pc-img,
.project-card:focus-within .pc-img { filter: none; }
.project-card:hover .pc-media::after,
.project-card:focus-within .pc-media::after { opacity: 0; }
```

`--duotone-wash` is defined per theme in `tokens.css`, pulling toward the
existing blue-grey linework colour rather than introducing a new hue:

```css
:root            { --duotone-wash: color-mix(in srgb, var(--datum) 55%, transparent); }
/* dark theme */ { --duotone-wash: color-mix(in srgb, var(--datum) 40%, transparent); }
```

The dark-theme value is weaker because the images already sit on a dark ground
and the same strength reads as mud.

**Two requirements this must not break.** `.pc-category` is a label sitting over
the media — its contrast is re-measured against the duotoned image, in both
themes, and over the *lightest* region of each of the seven photographs. And the
treatment must apply on `:focus-within` as well as `:hover`, so keyboard users
get the same reveal.

## 7. Motion — no JavaScript

**Scroll reveals** use CSS scroll-driven animations:

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal {
      animation: reveal-in linear both;
      animation-timeline: view();
      animation-range: entry 10% cover 30%;
    }
  }
}
```

**The default state is visible.** The hidden-then-revealed state exists only
inside both the `@supports` and the `prefers-reduced-motion` guard. Browser
support for `animation-timeline` is uneven, and the standard way this pattern
fails is content that is permanently invisible where the feature is missing.
Nothing here may hide content that an unsupporting browser cannot then reveal.

**Hero diagram draw-in.** The section diagram's polylines animate
`stroke-dashoffset` so the drawing plots itself. Paths carry `pathLength="1"` so
the dash values are normalised and no path measurement is needed. Wrapped in
`prefers-reduced-motion: no-preference`; the existing global reduced-motion
block already neutralises durations.

**Nav condensed state** on scroll uses `animation-timeline: scroll()`, same
guards, no JS.

## 8. Components

- **Cards** — corner registration ticks, hatch accent on hover, plus the duotone
  reveal from §6. The existing border-marks-hover rule stays; no lift, no drop
  shadow.

  **No numbered callout index on cards.** An earlier draft of this spec added
  `01/02/03` markers. `MEMORY.md` records that those were stripped from the old
  site as a templated tell and survive "in exactly one place — the engineering
  process, which genuinely is a sequence." A project grid is a set, not a
  sequence, and numbering it would reintroduce exactly what was removed.
- **Homepage stats strip** — re-cut as a ruled drawing schedule: hairline cells,
  mono tabular values, tick marks. Remains a `<dl>`.
- **Section headers** — the existing `.rule` gains an optional hatch inset.

## 9. Explicitly out of scope

Palette changes · type family changes · new photography · visible breadcrumbs
(Tier 3) · city landing pages (backlog item 2) · any content edit · any change to
`functions/api/contact.ts` or the form.

## 10. Verification

`tests/` does not exist yet. This work creates it, which also satisfies the
prerequisite for backlog item 9 (CI) and stops a third session from writing
throwaway scripts in a temp directory.

Add as devDependencies: `playwright-core`, `axe-core`. Both are dev-only and do
not enter the built output, so constraint 3 (§3) is unaffected. The Chromium binary is
already cached at
`~/Library/Caches/ms-playwright/chromium-1179/chrome-mac/Chromium.app/Contents/MacOS/Chromium`.

| # | Check | Pass condition |
|---|---|---|
| 1 | `npm run verify` | 0 errors, 0 warnings, 0 hints |
| 2 | axe-core, all pages × 2 viewports × 2 themes | 0 violations |
| 3 | Contrast on new grounds — body text over `.sheet-grid`, `.pc-category` over duotoned media, all mono labels | ≥ 4.5:1 body, ≥ 3:1 large/non-text |
| 4 | Horizontal overflow at 390px, every page | `scrollWidth <= clientWidth` |
| 5 | Content visible with `animation-timeline` unsupported | All `.reveal` content rendered at full opacity |
| 6 | Content visible under `prefers-reduced-motion: reduce` | Same |
| 7 | Keyboard parity on the duotone reveal | `:focus-within` reaches full colour |
| 8 | JS payload | No increase over the current ~2 KB |
| 9 | Console errors, both themes | None |

## 11. Documentation deliverable

A new subsection in `docs/IMPROVEMENTS.md` under item 7 (*Real project
photography*), listing what this design unlocks once real photographs exist:

- Full-bleed photographic section breaks between major sections
- A photographic or video hero as an alternative to the section diagram
- Relaxing or removing the duotone once imagery is consistent and high-resolution
- Larger project-detail hero images
- Before / during / after earthworks sequences — the most persuasive format
  available to this business, and impossible with stock imagery

`MEMORY.md` gets a session entry recording the direction chosen, the two
rejected, and why the references were not copied literally.

## 12. Risks

| Risk | Mitigation |
|---|---|
| The duotone is a taste call and may be disliked | It is isolated to a few rules and one token; look at it live first, and it can be dropped without touching anything else in this spec |
| Larger headings reintroduce 390px overflow | `clamp()` floor deliberately unchanged; check 4 covers it |
| Grid wash erodes text contrast on inset bands | Check 3 measures against the darkest point of the wash |
| Scroll-driven animation support is uneven | Default state is visible; `@supports` guard; check 5 |
| Decorative devices leak into the accessibility tree | All are pseudo-elements or `aria-hidden`; check 2 |

---

## 13. Open decisions — answer before starting

*Added 2026-09-21 after a review pass. The design above is unchanged; these are
gaps found by checking the spec against the code, not disagreements with it.*

### 13.1 What does the nav "condensed state" actually condense? — **blocking**

§7 specifies the mechanism (`animation-timeline: scroll()`, no JS) but never the
effect. This matters more than it looks, because `--nav-h` is load-bearing in six
places outside `Nav.astro`:

```
src/styles/global.css:29                     scroll-padding-top
src/components/Nav.astro:98                  the bar's own height
src/pages/services.astro:206                 scroll-margin-top
src/pages/services.astro:216                 sticky discipline-heading offset
src/pages/insights/[...slug].astro:244,251   scroll-margin-top
```

**Animating the height desynchronises every one of those from the real bar**, so
in-page anchors (`/services#grading`, article headings from the contents list)
land underneath it. That is a regression in navigation, traded for a visual
flourish.

**Recommended:** condense *padding and logo scale only*, leaving `--nav-h` fixed.
Reads as a condense, costs nothing, and the anchor maths stays true.

**If height must animate:** every rule above has to move to a second token that
tracks the animated value, and in-page anchor landing positions become a
verification item in §10. Do not discover this mid-implementation.

### 13.2 Does `tests/` ship in this pass or its own? — **scope**

§10 has this work create `tests/`. That is the right thing to build and it
unblocks backlog item 9 (CI), but it is a different kind of change from a visual
pass and roughly doubles the size of the task.

Either is defensible. Decide up front:

- **One pass** — the visual work lands already covered by the harness that proves
  it. Bigger diff, harder review.
- **Two passes** — build `tests/` first against the *current* UI, establishing a
  green baseline, then do the visual work against it. Slower, but a regression
  then shows up as a test that flipped rather than a number someone has to
  remember. **This is the safer order** and it is how the baseline in §3 was
  meant to work.

### 13.3 Drop one unnecessary check

§10 check 3 asks to re-measure `.pc-category` contrast "over the *lightest*
region of each of the seven photographs." `.pc-category` is opaque
(`background: var(--ink)` in `ProjectCard.astro`), so the image beneath cannot
affect its contrast — it is white on `#15181b` regardless of the duotone.

Keep the rest of check 3 (body text over `.sheet-grid` is a real risk). Drop the
`.pc-category` clause, or restate it as "confirm it is still opaque."

### 13.4 Two smaller notes, not blocking

- **The hero draw-in is a rewrite, not an addition.** `SectionDiagram.astro`
  already animates `.grade-line` with a hard-coded `stroke-dasharray: 1085`
  (lines 201–214). Moving to normalised `pathLength="1"` replaces that working
  code. Fine — just not purely additive, and the existing animation must not be
  left running alongside the new one.
- **§10 check 5 has a blind spot.** It covers `animation-timeline` being
  *unsupported*, which is the failure mode that hides content permanently. It
  does not cover the other common misfire: an element **already in the viewport
  on load**, where a `view()` timeline can settle at the wrong end of its range.
  Add that case — reload deep-linked and mid-page, confirm nothing is stuck
  hidden.
