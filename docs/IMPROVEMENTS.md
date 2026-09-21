# Improvements backlog

Post-launch roadmap, ordered by what each item is likely to do for lead volume.

This is the counterpart to [`TODO-BEFORE-LAUNCH.md`](./TODO-BEFORE-LAUNCH.md).
That file lists things that **block** launch. This one lists things that make the
site work harder once it is live. Nothing here is required to go live.

**Status key:** `TODO` · `IN PROGRESS` · `DONE` · `WON'T DO`
Update the status line when you pick something up, and note the date and outcome.
If you decide against an item, change it to `WON'T DO` and say why rather than
deleting it — the next person will otherwise re-propose it.

**Audited against the build on 2026-09-20.** Every "missing" claim below was
checked, not assumed.

---

## Tier 1 — do these next

### 1. Analytics — `DONE` (wired 2026-09-20, needs a token)

**Effort:** ~15 minutes · **Impact:** high

The contact form works now, but there is no way to know whether anyone reaches
the contact page, which service pulls traffic, which city visitors come from, or
what share of sessions end in an enquiry. Every other decision in this document
is guesswork until this exists.

**Chosen:** Cloudflare Web Analytics. Free, cookieless, no client-side state,
and therefore **no consent banner required under PIPEDA or GDPR**. It is already
part of the platform the site is moving to, so there is no extra vendor.

**What was built.** The code is done; one value is outstanding because it can
only be issued by a Cloudflare account that does not exist yet.

- `analytics.cloudflareToken` in `src/site.config.ts`, following the same
  `TODO()` placeholder pattern as the rest of that file.
- `src/layouts/Base.astro` emits the beacon before `</body>` **only when the
  token is a real value**. While it is a `TODO` the site ships no third-party
  script at all, rather than a tag that loads and measures nothing.
- CSP updated in `public/_headers`.
- Setup and verification steps in [`DEPLOYMENT.md`](./DEPLOYMENT.md) §3f;
  checklist entry as item 9 in [`TODO-BEFORE-LAUNCH.md`](./TODO-BEFORE-LAUNCH.md).

**To finish:** paste the beacon token into `site.config.ts` and deploy.

**The catch this item warned about, confirmed and handled.** It needs **two**
hosts, not one, and they are different origins:

| Directive | Host | Why |
|---|---|---|
| `script-src` | `https://static.cloudflareinsights.com` | serves `beacon.min.js` |
| `connect-src` | `https://cloudflareinsights.com` | receives the POST to `/cdn-cgi/rum` |

Allow only the first and the script loads, reports nothing, and looks perfectly
installed in the page source. Both are now in the policy. **Still verify in the
Network tab after deploying** — see §3f for exactly what to look for.

*Alternatives if you want more depth: Plausible or Umami, both self-hostable,
both paid or self-run. Avoid Google Analytics here — it needs a consent banner,
which costs conversions on a site this small.*

---

### 2. City × service landing pages — `TODO`

**Effort:** 1–2 days · **Impact:** highest available, if done properly

`src/site.config.ts` defines **11 service areas** and the site covers **6
disciplines**. There are currently **zero** pages targeting any combination.
"Grading design Calgary" and "stormwater engineer Grande Prairie" are close to
verbatim what these buyers type into Google.

**How:** a dynamic route at `src/pages/areas/[city].astro` using
`getStaticPaths()` over the `serviceAreas` array, the same pattern the project
and article detail pages already use.

**The caveat that decides whether this works or backfires:** each page must be
genuinely different. Local regulatory context, the municipality's actual
submission requirements, a relevant project, real local considerations. Eleven
pages with the city name swapped into the same paragraph is a doorway-page
pattern, and Google demotes those — it can cost you more than it gains.

That means this is **not** purely a code task. It needs someone who knows the
difference between, say, Calgary's and Kelowna's stormwater requirements. Budget
the writing, not just the template.

**Suggested scope for a first pass:** the 4–5 cities where M&Z actually wants
more work, rather than all 11. Expand once the pattern proves out in analytics
(item 1 — hence the ordering).

---

### 3. Structured data gaps — `DONE` (2026-09-20)

**Effort:** ~1 hour · **Impact:** moderate, very cheap

Was emitting: `ProfessionalService`, `WebSite`, `Article`. All three gaps are
now closed, each reading from a data structure that already existed:

| Schema | Where | Result |
|---|---|---|
| **`FAQPage`** | `src/pages/insights.astro` | 7 Question/Answer pairs, mapped from the same `faqs` array the `<details>` list renders, so the two cannot drift. |
| **`BreadcrumbList`** | `src/layouts/Base.astro` | On all 20 indexable pages. Skipped on the homepage (a one-item trail says nothing) and on `noindex` pages. |
| **`Service`** | `src/pages/services.astro` | 6 nodes from the `disciplines` array, each anchored at its existing `#id` and deferring to the organization by `@id`. |

`Base.astro` gained a `schema?: Record<string, unknown>[]` prop. Page-level nodes
are appended to the existing `@graph` rather than emitted as a second script
element, so they can reference `#organization` by `@id` instead of restating the
firm on every page.

**Two things worth knowing, neither of which was obvious when this was written:**

1. **The FAQ payoff is smaller than this item claimed.** Google restricted FAQ
   rich results to authoritative government and health sites in 2023. Describing
   it as "free eligibility for expanded search results" was wrong for a site like
   this one — expanded results are very unlikely. The markup stays because it is
   accurate, costs almost nothing, and is still read by other engines and by
   assistants. Do not expect to see it in Google's SERP and conclude it is broken.
2. **Breadcrumbs must be built from `canonicalPath`, not `Astro.url.pathname`** —
   gotcha #1 in `CLAUDE.md` applies directly here. The raw pathname would have put
   `/services.html` in the trail, disagreeing with the canonical tag. There is a
   regression assertion for this.

**Validation status — read this before calling it verified.** 650 structural
assertions pass against `dist/` (JSON-LD parses, expected node types per page,
every `@id` reference resolves, no `.html` in breadcrumb URLs, breadcrumb leaf
agrees with the canonical tag, every marked-up FAQ and service name is actually
rendered on its page). **Google's Rich Results Test has not been run**, because
it needs a public URL and the site is not deployed yet. Run it against the
`*.pages.dev` URL once Pages is up.

---

### 4. Prequalification and safety certifications — `TODO`

**Effort:** ~30 minutes of code · **Impact:** potentially very high · **Blocked on business info**

The item on this list you are least likely to think of, and possibly the most
valuable.

For Alberta industrial and energy work, **ISNetworld, ComplyWorks, Avetta and
COR** status is frequently a hard gate on being permitted to bid at all.
Displaying them tells a procurement person you are already through their vendor
screen — a stronger buying signal than any design or copy change on this list.

**If M&Z holds any of these:** add them to `src/site.config.ts` alongside
`credentials`, and surface them in the footer title block next to the APEGA and
EGBC permit numbers, plus on the About page.

**If M&Z does not hold them and wants industrial or energy work:** that is a
business decision worth making deliberately, not a website problem. Flagging it
here because the website makes the gap visible.

---

## Tier 2 — worth doing after

### 5. A CMS, so the site does not stagnate — `TODO`

**Effort:** ~half a day · **Impact:** high over time

Adding a project currently means editing Markdown and committing. If the owner
cannot update the site without an engineer, it will not get updated, and a
portfolio that never grows stops being persuasive.

**Recommended:** [Keystatic](https://keystatic.com). Git-based, free, native
Astro integration, admin UI at `/admin`. It edits the same Markdown files in
`src/content/` — no database, no content migration, no lock-in, and the schemas
in `src/content.config.ts` carry over. If it is ever removed the content is
untouched.

*Alternatives: Decap CMS (also git-based, older, heavier). Sanity or Contentful
would mean moving content out of the repo — not worth it at this scale.*

---

### 6. The lead magnets that were already advertised — `TODO`

**Effort:** ~1 day · **Impact:** moderate to high

The old site listed **six PDF resources** and every one was a dead link. The
content for at least two already exists in the articles written for this
rebuild:

- **Site Grading Design Checklist** — from `site-grading-challenges.md`
- **AB & BC regulatory reference** — from `municipal-approvals-ab-bc.md`

Gated behind an email capture, these catch the buyer who is researching but not
yet ready to phone. That is a different and larger audience than the one filling
in the enquiry form.

**Needs:** PDF production, a capture form (the `/api/contact` Function can be
extended rather than duplicated), and delivery. **Same liability rule as the
articles — a P.Eng. reviews anything that goes out under the firm's name.**

---

### 7. Real project photography — `TODO`

**Effort:** not a code task · **Impact:** highest credibility change available

The seven images are stock, carried over from the old site. Also:
`src/assets/images/tank-farm-containment.jpg` is only **289×175 px** and will
look soft.

Photographs of actual M&Z sites — during earthworks, finished grades, a pond
under construction — would do more for credibility than anything else on this
list. Drop a file into `src/assets/images/` and update the `image:` path in the
relevant Markdown; Astro regenerates every responsive size automatically.

---

### 8. A booking link — `TODO`

**Effort:** ~30 minutes · **Impact:** moderate

Cal.com or Calendly, offered beside the enquiry form. Some buyers will book
fifteen minutes who would never write a paragraph describing their site.

Prefer a link over an embedded iframe: an embed means another CSP entry, a
third-party script on the critical path, and a slower contact page. A link costs
nothing and converts nearly as well.

---

### 9. CI — `TODO`

**Effort:** 2–3 hours including moving the tests · **Impact:** protects everything else

No `.github/workflows/` exists. A GitHub Actions workflow running
`npm run verify` plus the axe-core suite on every PR would stop regressions in
the 0-violation accessibility baseline and the 0/0/0 check result.

**Prerequisite:** the Playwright verification scripts from the rebuild ran from
an ephemeral job directory and no longer exist. The approach is documented in
[`../CLAUDE.md`](../CLAUDE.md) under *Verification expectations*, including where
the cached Chromium binary lives. Recreate them under `tests/` with
`playwright-core` and `axe-core` as devDependencies, then wire up the workflow.

Worth adding a Lighthouse budget at the same time so the payload work done in
the rebuild does not quietly erode.

---

### 10. RSS feed for Insights — `TODO`

**Effort:** ~30 minutes · **Impact:** low but trivial

`@astrojs/rss` plus `src/pages/rss.xml.ts` reading the `insights` collection.
Makes the articles syndicatable and is a small signal that the section is a real
publication rather than filler.

---

## Tier 3 — later, or only once conditions are met

| Item | Condition |
|---|---|
| **Testimonials / client logos** | Needs written client permission. Strong when real. |
| **Search over Insights** | Not worth it below ~20 articles. Currently 6. |
| **Visible breadcrumbs** | The `BreadcrumbList` schema now exists (item 3), so this is just the UI. Google prefers the markup to mirror something visible, though it does not require it. |
| **Dark mode toggle** | Dark mode works and is audited, but follows the OS only. A manual toggle is a nice-to-have; `tokens.css` already supports `[data-theme]`. |
| **Print stylesheet for articles** | Only if people actually print them. |
| **More articles** | Six is a credible start. Cadence beats volume — one good piece a quarter, P.Eng.-reviewed. |

---

## Explicitly not worth doing

Recorded so they do not get re-proposed each time someone looks at the site.

- **Live chat** — staffing cost, and this buyer emails or phones.
- **Client portal / authenticated drawing downloads** — only if there is real
  client demand. **This would change the stack decision**: it is the scenario
  where Next.js beats Astro, and migrating later is real work. Raise it before
  building it, not after.
- **i18n** — the market is English-speaking AB and BC.
- **PWA / offline** — a marketing site has nothing useful to do offline.
- **Error monitoring (Sentry etc.)** — the site is static with ~2 KB of JS. The
  Function already logs to Cloudflare.
- **Google Analytics** — needs a consent banner, which costs conversions. See
  item 1.

---

## The honest constraint

None of the above addresses the real limit on this site's performance.

**The content is still generic.** No named clients, no photographs of actual M&Z
work, no named engineers, no permit numbers, no verified project outcomes. A
developer comparing three consultancies cannot currently tell M&Z apart from the
other two on anything except the quality of the website.

Items **4** and **7**, and the blocking entries in
[`TODO-BEFORE-LAUNCH.md`](./TODO-BEFORE-LAUNCH.md), beat every technical item in
this document. They are also the only ones that cannot be done by an engineer
working alone — they need information and decisions from the business.

Items 1 and 3 are now shipped, which cost an afternoon and changed none of the
above. If the choice is between shipping the remaining technical items and
spending the same time getting real photographs and permit numbers onto the site,
**choose the latter**.
