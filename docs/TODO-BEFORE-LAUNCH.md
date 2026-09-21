# Before this goes live

Everything here is information only you have. Every item but the last renders on
the site as a yellow hazard-striped `TODO` marker until it is filled in, so
nothing can ship silently missing. (Item 9, the analytics token, is the one
exception — it has no visible surface to mark.)

**Almost all of it lives in one file: `src/site.config.ts`.**

---

## 1. Contact details — blocking

The old site had no phone number, no email address and no office location on any
page. The only route to you was a form that did not send anything. These are the
highest-value items on this list.

In `src/site.config.ts`, the `contact` object:

| Field | What it is |
|---|---|
| `phone` | Display format, e.g. `'(780) 555-0134'` |
| `phoneHref` | E.164 for the `tel:` link, e.g. `'+17805550134'` |
| `email` | The address enquiries should reach |
| `address.street` / `.city` / `.region` / `.postalCode` | Office location |
| `linkedin` | Company page URL, or delete the field to hide the icon |

Replace `TODO('…')` with the real string:

```ts
phone: '(780) 555-0134',
phoneHref: '+17805550134',
```

Once `phone` is set, a click-to-call link appears in the header on every page and
a call button appears in each call-to-action band. Until then they are hidden
rather than broken.

## 2. Professional registration — blocking

In the `credentials` object. A municipal reviewer or a developer vetting you
looks for a Permit to Practice number, and there was nothing on the old site to
find.

- `apegaPermit` — APEGA Permit to Practice number (Alberta)
- `egbcPermit` — EGBC Permit to Practice number (British Columbia)

These appear in the footer title block, on the About page, and in the site's
structured data where search engines read them.

## 3. Named engineers — strongly recommended

`credentials.engineers` is an empty array. Adding entries replaces the
placeholder block on the About page with real profiles:

```ts
engineers: [
  {
    name: 'Jordan Mikhailov',
    designation: 'P.Eng.',
    role: 'Principal — Grading & Earthworks',
    registrations: ['APEGA #123456', 'EGBC #78901'],
    bio: 'Fifteen years on industrial grading and mass haul optimization across northern Alberta.',
  },
],
```

## 4. Contact form delivery — blocking

The form posts to a real Cloudflare Function, but it needs credentials. See
[`DEPLOYMENT.md`](./DEPLOYMENT.md) §3. You need:

- A Resend account and a verified sending domain
- `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` set in Cloudflare
- Optionally a Turnstile site key in `forms.turnstileSiteKey` plus
  `TURNSTILE_SECRET` in Cloudflare, for bot screening

Without these the form returns a clear message telling people to call or email
instead — it does not pretend to succeed, which is what the old one did.

## 5. Figures that need substantiating — please check

`stats` in `src/site.config.ts` carries these over from the old site:

- `yearsExperience: 15`
- `projectsDelivered: 200`

These appear on the homepage, the About page and in several headings. In a
regulated profession an unsupportable claim is a liability. If they are
estimates, either confirm them or soften the wording.

## 6. Project details — as they become available

The nine projects in `src/content/projects/*.md` carry the real descriptions from
the old site. Each frontmatter block accepts optional fields that are currently
unset on most entries:

- `location` — appears as a fact on the project page
- `client` — only where you have permission to name them
- `year`
- `metrics` — measured outcomes, shown on the card and the detail page

Adding a field makes it render; leaving it out hides it cleanly. Two projects
already carry locations (Fort McMurray and Calgary) that came from the old
copy — confirm those are cleared for publication.

## 7. Article review — before publishing

`src/content/insights/*.md` contains six full technical articles written from the
summaries on the old site. **They should be reviewed by a P.Eng. before going
live.**

They deliberately describe general engineering principles and avoid citing
specific regulatory thresholds, clause numbers or design criteria, because a
wrong number published under an engineering firm's name is a professional
liability. Where a requirement varies by jurisdiction the articles say so and
point the reader at the governing municipal standard.

If you want them to carry specific AB/BC criteria, add them — but they need to be
verified against the current standard, and they will need periodic review as the
standards change.

To hold an article back, set `draft: true` in its frontmatter. It will vanish
from the index, the sitemap and the build.

## 8. Images — quality

The seven photographs are the stock images carried over from the old site,
extracted from the base64 that was inlined in the HTML.

- `src/assets/images/tank-farm-containment.jpg` is only **289×175 px**. It is
  used on the tank farm project and will look soft. Replace it when you can.
- The rest are 800–1200 px wide, which is adequate but not generous.

Replacing any of them with photographs of your own work would do more for
credibility than anything else on this list. Drop a new file into
`src/assets/images/` and update the `image:` path in the relevant Markdown file —
Astro regenerates every responsive size automatically.

## 9. Analytics token — optional, but do it before launch

`analytics.cloudflareToken` in `src/site.config.ts`.

This is the one item on this list that does **not** render a yellow hazard
stripe, because it lives in the page's `<head>`/`<body>` chrome rather than in
visible content. Until it holds a real token, no analytics script is emitted at
all — the site is simply not measured.

Worth doing before launch rather than after: traffic from the first weeks is not
recoverable retroactively, and every priority call in
[`IMPROVEMENTS.md`](./IMPROVEMENTS.md) is guesswork without it.

Cloudflare dashboard → Web Analytics → add site → copy the beacon token. Full
steps, including how to confirm it is really reporting, are in
[`DEPLOYMENT.md`](./DEPLOYMENT.md) §3f.

---

## Quick check before launch

```bash
npm run verify          # type check + build; fails on any content schema error
grep -rn "TODO(" src/site.config.ts   # anything still unfilled
```

Note that `analytics.cloudflareToken` (item 9) appears in that `grep` but, unlike
everything else here, leaves no visible marker on the page.

Then load the site and look for yellow hazard stripes. If you see none, every
placeholder has been filled.
