/**
 * POST /api/contact — Cloudflare Pages Function.
 *
 * Validates the enquiry, screens it for spam, rate-limits by IP, and emails it
 * through Resend. Runs on Cloudflare's edge alongside the static site.
 *
 * Required environment variables (set in the Cloudflare dashboard as encrypted
 * secrets, never committed):
 *   RESEND_API_KEY     — from resend.com
 *   CONTACT_TO         — where enquiries are delivered
 *   CONTACT_FROM       — a verified sender on your Resend domain
 *   TURNSTILE_SECRET   — optional; enables bot screening
 *
 * Optional binding:
 *   RATE_LIMIT         — a KV namespace. Without it, rate limiting is skipped
 *                        and the function still works.
 */

interface Env {
  RESEND_API_KEY: string;
  CONTACT_TO: string;
  CONTACT_FROM: string;
  TURNSTILE_SECRET?: string;
  RATE_LIMIT?: KVNamespace;
}

interface Enquiry {
  name: string;
  company: string;
  email: string;
  phone: string;
  projectType: string;
  location: string;
  message: string;
}

const MAX_PER_WINDOW = 5;
const WINDOW_SECONDS = 3600;

const LIMITS: Record<keyof Enquiry, number> = {
  name: 120,
  company: 160,
  email: 200,
  phone: 40,
  projectType: 80,
  location: 160,
  message: 8000,
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

/** Escapes text before it is interpolated into the HTML email body. */
const esc = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Strips CR/LF so a submitted value cannot inject extra headers into the
 * outgoing message (the reply-to address in particular).
 */
const oneLine = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();

const validate = (data: Enquiry): string | null => {
  if (!data.name.trim()) return 'Enter your name';
  if (!data.email.trim()) return 'Enter your email address';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    return 'Enter an email address in the format name@example.com';
  }
  if (!data.projectType.trim()) return 'Choose a project type';
  if (data.message.trim().length < 20) {
    return 'Tell us a little about the project — at least a sentence or two';
  }

  for (const [key, max] of Object.entries(LIMITS)) {
    if (data[key as keyof Enquiry].length > max) {
      return `That ${key} is longer than we can accept`;
    }
  }

  return null;
};

const verifyTurnstile = async (
  secret: string,
  token: string,
  ip: string
): Promise<boolean> => {
  if (!token) return false;

  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const result = (await res.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
};

/**
 * Fixed-window counter keyed by IP. Approximate by design — its job is to stop
 * a script hammering the endpoint, not to be exact at the boundary.
 */
const overRateLimit = async (kv: KVNamespace, ip: string): Promise<boolean> => {
  const key = `contact:${ip}`;

  try {
    const current = Number((await kv.get(key)) ?? '0');
    if (current >= MAX_PER_WINDOW) return true;
    await kv.put(key, String(current + 1), { expirationTtl: WINDOW_SECONDS });
    return false;
  } catch {
    // A KV failure must not take the contact form down with it.
    return false;
  }
};

const handlePost: PagesFunction<Env> = async ({ request, env }) => {
  const ip = request.headers.get('CF-Connecting-IP') ?? '';

  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    console.error('contact: missing RESEND_API_KEY, CONTACT_TO or CONTACT_FROM');
    return json(
      { error: 'The contact form is not configured yet. Please email or call us directly.' },
      503
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'We could not read that submission.' }, 400);
  }

  const field = (name: string) => String(form.get(name) ?? '').slice(0, 10_000);

  // Honeypot: a real person never sees this input, so anything in it is a bot.
  // Answer 200 so the bot believes it succeeded and does not retry.
  if (field('website').trim()) {
    return json({ ok: true }, 200);
  }

  const data: Enquiry = {
    name: field('name'),
    company: field('company'),
    email: field('email'),
    phone: field('phone'),
    projectType: field('projectType'),
    location: field('location'),
    message: field('message'),
  };

  const invalid = validate(data);
  if (invalid) return json({ error: invalid }, 400);

  if (env.TURNSTILE_SECRET) {
    const ok = await verifyTurnstile(env.TURNSTILE_SECRET, field('cf-turnstile-response'), ip);
    if (!ok) {
      return json({ error: 'We could not verify that submission. Please try again.' }, 403);
    }
  }

  if (env.RATE_LIMIT && ip && (await overRateLimit(env.RATE_LIMIT, ip))) {
    return json(
      { error: 'That is a few enquiries in a short time. Please email or call us directly.' },
      429
    );
  }

  const received = new Date().toISOString();
  const subject = `Project enquiry — ${oneLine(data.projectType)} — ${oneLine(data.name)}`;

  const rows: Array<[string, string]> = [
    ['Name', data.name],
    ['Company', data.company || '—'],
    ['Email', data.email],
    ['Phone', data.phone || '—'],
    ['Project type', data.projectType],
    ['Location', data.location || '—'],
  ];

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:640px;color:#15181b">
      <p style="font:500 12px/1.4 ui-monospace,monospace;letter-spacing:.08em;
                text-transform:uppercase;color:#4a5a61;margin:0 0 4px">
        Project enquiry
      </p>
      <h1 style="font-size:20px;margin:0 0 20px">${esc(data.name)}${
        data.company ? ` &mdash; ${esc(data.company)}` : ''
      }</h1>
      <table style="border-collapse:collapse;width:100%;margin-bottom:24px">
        ${rows
          .map(
            ([k, v]) => `<tr>
              <td style="padding:8px 16px 8px 0;border-bottom:1px solid #e2e2da;
                         font-size:12px;text-transform:uppercase;letter-spacing:.06em;
                         color:#4a5a61;white-space:nowrap">${esc(k)}</td>
              <td style="padding:8px 0;border-bottom:1px solid #e2e2da;font-size:14px">${esc(v)}</td>
            </tr>`
          )
          .join('')}
      </table>
      <p style="font:500 12px/1.4 ui-monospace,monospace;letter-spacing:.08em;
                text-transform:uppercase;color:#4a5a61;margin:0 0 8px">
        About the project
      </p>
      <div style="padding:16px;background:#f4f4ef;border-left:3px solid #c2410c;
                  font-size:14px;line-height:1.7;white-space:pre-wrap">${esc(data.message)}</div>
      <p style="margin-top:24px;font-size:12px;color:#8d9aa0">
        Received ${esc(received)}${ip ? ` from ${esc(ip)}` : ''}
      </p>
    </div>`;

  const text = [
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'About the project:',
    data.message,
    '',
    `Received ${received}`,
  ].join('\n');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: [env.CONTACT_TO],
        // Replying to the notification replies to the enquirer.
        reply_to: oneLine(data.email),
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      console.error('contact: resend returned', res.status, await res.text());
      return json(
        { error: 'We could not send that just now. Please email or call us directly.' },
        502
      );
    }
  } catch (err) {
    console.error('contact: resend request failed', err);
    return json(
      { error: 'We could not send that just now. Please email or call us directly.' },
      502
    );
  }

  return json({ ok: true }, 200);
};

/**
 * Single entry point. Pages resolves `onRequest` for every method, so the
 * method check lives here rather than in a separate `onRequestPost` export —
 * exporting both would leave which one runs up to the router.
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const { method } = context.request;

  if (method === 'POST') return handlePost(context);

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { Allow: 'POST, OPTIONS' } });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'POST, OPTIONS' },
  });
};
