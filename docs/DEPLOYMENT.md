# Deployment

The site moves from GitHub Pages to **Cloudflare Pages**. Same domain, same
static output — Cloudflare additionally runs the contact form function at
`/api/contact`, which GitHub Pages cannot do because it serves static files only.

Nothing here is urgent to do all at once. The site builds and runs locally today;
steps 1–2 put it online, step 3 makes the contact form deliver, step 4 moves the
domain.

---

## 0. Prerequisites

**Node 22.12 or newer.** Astro 7 requires it, and it is the reason the build
failed on the machine this was set up on (Node 22.11 was installed). The repo
pins a version in `.nvmrc`:

```bash
nvm use            # reads .nvmrc → Node 24 LTS
node --version     # must be >= 22.12.0
npm install
```

Verify the whole thing builds:

```bash
npm run verify     # astro check && astro build  → expect 0 errors
```

---

## 1. Local development

```bash
npm run dev        # Astro dev server, hot reload — http://localhost:4321
```

`npm run dev` does **not** run the contact function. To exercise the full stack
the way production does:

```bash
cp .dev.vars.example .dev.vars      # then fill in your Resend key
npm run dev:full                    # builds, then serves via Wrangler on :8788
```

`.dev.vars` is gitignored. Never commit it.

---

## 2. Create the Cloudflare Pages project

1. Push this branch and merge to `main`.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → pick `ryanalmasi/mz-design-consulting-ltd`.
3. Build settings:

   | Setting | Value |
   |---|---|
   | Framework preset | Astro |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Node version | `22.12.0` or later — set env var `NODE_VERSION` |

4. Deploy. You get a `*.pages.dev` URL. Check it before touching DNS.

Every push to `main` redeploys. Pull requests get their own preview URL.

---

## 3. Contact form delivery

The function is `functions/api/contact.ts`. It validates the submission, screens
it for spam, rate-limits by IP, and sends the enquiry through Resend.

### 3a. Resend

1. Sign up at [resend.com](https://resend.com) — the free tier covers 100
   emails/day, far above what an enquiry form generates.
2. **Domains** → add `mzdesignconsulting.com` → add the DKIM/SPF records it
   gives you to your DNS. Verification usually completes within the hour.
3. **API Keys** → create one with *Sending access* only.

### 3b. Cloudflare environment variables

Pages project → **Settings** → **Environment variables** → **Production**. Add
each as an **encrypted secret**, not plaintext:

| Variable | Value | Required |
|---|---|---|
| `RESEND_API_KEY` | `re_…` from step 3a | yes |
| `CONTACT_TO` | where enquiries are delivered | yes |
| `CONTACT_FROM` | a verified sender, e.g. `website@mzdesignconsulting.com` | yes |
| `TURNSTILE_SECRET` | from step 3c | no |

If any of the three required variables is missing the endpoint returns a clear
"not configured yet, please call or email us" message rather than failing
silently. Redeploy after adding them — env vars apply at deploy time.

### 3c. Turnstile (bot screening — optional but recommended)

1. Cloudflare dashboard → **Turnstile** → **Add site** → domain
   `mzdesignconsulting.com`, widget type **Managed**.
2. Put the **site key** (public, safe to commit) in `src/site.config.ts`:
   ```ts
   turnstileSiteKey: '0x4AAAAAAA…',
   ```
3. Put the **secret key** in Cloudflare env vars as `TURNSTILE_SECRET`.

The widget and its script only load when the site key is set, so leaving it unset
costs nothing.

### 3d. Rate limiting (optional)

The function limits submissions per IP if a KV namespace is bound, and skips the
check silently if not — it never takes the form down.

1. **Workers & Pages** → **KV** → create a namespace, e.g. `mz-contact-rate`.
2. Pages project → **Settings** → **Bindings** → **KV namespace**:
   variable name `RATE_LIMIT`, pointed at that namespace.

Default: 5 submissions per IP per hour (`MAX_PER_WINDOW` / `WINDOW_SECONDS` in
the function).

### 3e. Verify it end to end

Submit a real enquiry through the deployed site and confirm it arrives. Then
check the failure path still behaves — the form should report a problem rather
than showing a false success, which is exactly what the old site did.

### 3f. Web analytics (optional, 5 minutes)

Cloudflare Web Analytics is cookieless and stores nothing on the client, so it
needs **no consent banner** under PIPEDA or GDPR. The site is wired for it but
ships it disabled.

1. Cloudflare dashboard → **Web Analytics** → **Add a site** →
   `mzdesignconsulting.com`.
2. It issues a **beacon token** — a short hex string. It is public; committing it
   is fine.
3. Put it in `src/site.config.ts`:

   ```ts
   export const analytics = {
     cloudflareToken: 'your-token-here',
   } as const;
   ```

4. Rebuild and deploy. Until this is a real value **no analytics script is
   emitted at all** — the site does not ship a beacon that quietly measures
   nothing.

**Do not use the dashboard's "automatic setup" toggle for Pages projects as
well.** It injects its own beacon, and with the token also set in config you get
two beacons and double-counted pageviews. Pick one; the config route is the one
this repo documents.

**Verifying it actually works.** A beacon that loads but cannot report looks
identical to a working one in the page source. Open the deployed site with
DevTools → **Network**, filter `cloudflareinsights`, and confirm **two** things:

- `beacon.min.js` returns **200**
- a **POST to `cloudflareinsights.com/cdn-cgi/rum`** returns **204**

If the POST is missing, check the **Console** for a CSP violation. The policy in
`public/_headers` already allows both hosts (`static.cloudflareinsights.com` in
`script-src`, `cloudflareinsights.com` in `connect-src`) — they are different
origins and both are required.

Data takes a few minutes to appear in the dashboard.

---

## 4. Move the domain

Do this **after** the `*.pages.dev` URL looks right.

1. Pages project → **Custom domains** → **Set up a custom domain** →
   `mzdesignconsulting.com`. Add `www` too if you use it.
2. Cloudflare gives you the DNS records. If the domain is already on Cloudflare
   DNS it wires them up itself; otherwise update them at your registrar.
3. Remove the GitHub Pages DNS records (the four `185.199.x.x` A records and/or
   the `ryanalmasi.github.io` CNAME) so they cannot serve stale content.
4. In the GitHub repo → **Settings** → **Pages** → set source to **None**.
5. TLS is issued automatically. Give it a few minutes.

The `CNAME` file at the repo root is GitHub Pages' mechanism and has no effect on
Cloudflare. It is harmless to leave, but you can delete it once the cutover is
done.

### URLs are preserved

The build emits flat files (`/services.html`, `/projects/municipal-swm-pond.html`)
matching the old structure, and Cloudflare serves them at the extensionless paths
too. Old links keep working — no redirect map needed.

---

## 5. What is deployed

| File | Purpose |
|---|---|
| `public/_headers` | Security headers + cache policy. Fingerprinted assets are immutable for a year; HTML revalidates. |
| `public/_routes.json` | Restricts the Function to `/api/*` so static requests never invoke it. |
| `wrangler.toml` | Project name and build output directory. |

The Content-Security-Policy in `_headers` allows Turnstile and Cloudflare Web
Analytics, and nothing else third-party. **If you add any other script later you
must add its origin there**, or the browser will block it — and note that a
script host and the host it reports to are often different origins needing
`script-src` and `connect-src` entries respectively.

---

## 6. Routine tasks

**Add a project** — create `src/content/projects/my-project.md`, copy the
frontmatter shape from an existing one, drop an image into
`src/assets/images/`. It appears on the index, gets a detail page, joins the
sector filter and enters the sitemap. A typo in `category` fails the build rather
than shipping a broken filter.

**Add an article** — same, in `src/content/insights/`. Set `draft: true` to keep
it out of the build.

**Change contact details or figures** — `src/site.config.ts`, one place, used
everywhere including the structured data.

**Deploy manually** (bypassing Git):

```bash
npm run deploy     # build + wrangler pages deploy dist
```

---

## 7. Troubleshooting

**Build fails with "Node.js vX is not supported"** — `nvm use`, then reinstall
`node_modules`. Astro 7 needs ≥22.12.

**Contact form says "not configured yet"** — one of `RESEND_API_KEY`,
`CONTACT_TO`, `CONTACT_FROM` is missing in Cloudflare, or the deploy predates
them being added. Redeploy.

**Form returns "could not send"** — Resend rejected it. Check the Function logs
(Pages project → **Logs**); the status code and Resend's message are logged.
Usually an unverified sending domain or an expired key.

**Content change not appearing** — HTML is set to revalidate, so this is normally
a build that has not finished. Check the deploy log.
