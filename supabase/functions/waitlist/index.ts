// getawa.app waiting list (Supabase Edge Function "waitlist").
//
// POST { action: "join", email, website }  -> saves the address and sends the confirmation email
// POST { action: "confirm", token }         -> marks the address as confirmed
//
// Double opt-in: an address only counts once the person clicks the link in the email.
// The answer to "join" is the same whether the address is new, waiting or already confirmed,
// so the form can't be used to find out who is on the list.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY  a Resend key with "Sending access" only, limited to getawa.app
//   MAIL_FROM       optional, default "Awa <hello@getawa.app>"
// SUPABASE_DB_URL is provided by Supabase automatically.
//
// Deploy:  npx supabase@latest functions deploy waitlist --project-ref aqodeoaxcuhivxesfxbb --no-verify-jwt --use-api

import postgres from 'npm:postgres@3.4.5';

const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { prepare: false, max: 1 });
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const MAIL_FROM = Deno.env.get('MAIL_FROM') ?? 'Awa <hello@getawa.app>';

const SITE = 'https://getawa.app';
const ORIGINS = new Set([SITE, 'https://www.getawa.app', 'https://awa-website-4tv.pages.dev', 'http://localhost:5195']);

const RESEND_AFTER_MIN = 10;   // a second email to the same address only after 10 minutes
const MAX_SENDS = 3;           // and at most 3 per address
const MAX_PER_HOUR = 60;       // all addresses together, to protect the sending domain
const MAX_PER_DAY = 70;        // Resend free plan = 100 a day, shared with the app's sign-in codes: keep 30 for them
const LINK_DAYS = 7;           // matches the nightly clean-up in waitlist.sql

function cors(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && ORIGINS.has(origin) ? origin : SITE,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function reply(status: number, body: Record<string, unknown>, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function validEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function emailHtml(link: string) {
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:0;background:#ffffff;">
<div style="max-width:480px;margin:0 auto;padding:40px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#211F1C;">
  <p style="margin:0 0 32px;font-size:24px;font-weight:700;letter-spacing:-0.5px;color:#1F4080;">awa</p>
  <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;font-weight:700;color:#1F4080;">Confirm your email</h1>
  <p style="margin:0 0 28px;font-size:16px;line-height:1.55;">Thanks for joining the Awa waiting list. Confirm your email and we'll write to you once, when Awa is on the App Store.</p>
  <p style="margin:0 0 28px;"><a href="${link}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#1F4080;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;">Confirm my email</a></p>
  <p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#615952;">The link works for ${LINK_DAYS} days.</p>
  <p style="margin:0;font-size:14px;line-height:1.5;color:#615952;">Didn't sign up? Ignore this email and you won't hear from us.</p>
</div>
</body></html>`;
}

function emailText(link: string) {
  return `Confirm your email

Thanks for joining the Awa waiting list. Confirm your email and we'll write to you once, when Awa is on the App Store.

Confirm my email: ${link}

The link works for ${LINK_DAYS} days.
Didn't sign up? Ignore this email and you won't hear from us.`;
}

async function sendConfirmation(email: string, link: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [email],
      subject: 'Confirm your email for Awa',
      html: emailHtml(link),
      text: emailText(link),
    }),
  });
  if (!res.ok) console.error('resend', res.status, await res.text());
  return res.ok;
}

async function join(body: Record<string, unknown>, origin: string | null) {
  // Hidden "website" field: people never see it, simple bots fill it in. Pretend it worked.
  if (typeof body.website === 'string' && body.website.trim() !== '') return reply(200, { ok: true }, origin);

  const email = String(body.email ?? '').trim().toLowerCase();
  if (!validEmail(email)) return reply(400, { error: 'email' }, origin);

  const [{ hour, day }] = await sql`select count(*) filter (where last_sent_at > now() - interval '1 hour')::int as hour,
                                           count(*)::int as day
                                    from waitlist.people where last_sent_at > now() - interval '24 hours'`;
  if (day >= MAX_PER_DAY) return reply(429, { error: 'day' }, origin);
  if (hour >= MAX_PER_HOUR) return reply(429, { error: 'busy' }, origin);

  const site = origin && ORIGINS.has(origin) ? origin : SITE;
  const token = newToken();
  const hash = await sha256(token);
  const link = `${site}/confirm/?t=${token}`;

  const [row] = await sql`select confirmed_at, sends, last_sent_at > now() - make_interval(mins => ${RESEND_AFTER_MIN}) as recent
                          from waitlist.people where email = ${email}`;

  if (!row) {
    await sql`insert into waitlist.people (email, token_hash) values (${email}, ${hash}) on conflict (email) do nothing`;
    if (!(await sendConfirmation(email, link))) {
      await sql`delete from waitlist.people where email = ${email} and confirmed_at is null and sends = 1`;
      return reply(502, { error: 'send' }, origin);
    }
    return reply(200, { ok: true }, origin);
  }

  // Already confirmed, sent a moment ago, or sent too often: say nothing new.
  if (row.confirmed_at || row.recent || row.sends >= MAX_SENDS) return reply(200, { ok: true }, origin);

  await sql`update waitlist.people set token_hash = ${hash}, last_sent_at = now(), sends = sends + 1,
            created_at = now() where email = ${email} and confirmed_at is null`;
  if (!(await sendConfirmation(email, link))) return reply(502, { error: 'send' }, origin);
  return reply(200, { ok: true }, origin);
}

async function confirm(body: Record<string, unknown>, origin: string | null) {
  const token = String(body.token ?? '');
  if (!/^[0-9a-f]{64}$/.test(token)) return reply(404, { error: 'link' }, origin);
  const hash = await sha256(token);
  const rows = await sql`update waitlist.people set confirmed_at = coalesce(confirmed_at, now())
                         where token_hash = ${hash}
                           and (confirmed_at is not null or created_at > now() - make_interval(days => ${LINK_DAYS}))
                         returning 1`;
  return rows.length ? reply(200, { ok: true }, origin) : reply(404, { error: 'link' }, origin);
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== 'POST') return reply(405, { error: 'method' }, origin);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: 'body' }, origin);
  }

  try {
    if (body.action === 'join') return await join(body, origin);
    if (body.action === 'confirm') return await confirm(body, origin);
    return reply(400, { error: 'action' }, origin);
  } catch (err) {
    console.error(err);
    return reply(500, { error: 'server' }, origin);
  }
});
