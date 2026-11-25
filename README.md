# getawa.app

The website for Awa, the iPhone app that helps you notice how your apps make you feel.
Static site, served by Cloudflare Pages from `public/`. No framework, no build step on Cloudflare.

## Working on it

```
python3 build.py         # writes public/ (the live site)
python3 build.py --dev   # writes .dev/ with test hooks (not committed)
```

Edit the sources, then rebuild:

- `build.py`: page structure and copy
- `src/base.css`, `src/site.css`: styles (combined into `public/styles.css`)
- `src/form.js`, `src/site.js`: behaviour (combined into `public/main.js`)
- `src/dev-hooks.js`: local test hooks, only in `.dev/`

Fonts: Bricolage Grotesque, self-hosted in `public/fonts` (SIL Open Font License). No Google Fonts, no tracking, no cookies.

## Cloudflare Pages settings

- Build command: none
- Build output directory: `public`

## Waiting list (Supabase + Resend)

- `supabase/waitlist.sql`: the table (private `waitlist` schema, not reachable through the public API)
  and the nightly job that deletes unconfirmed addresses after 7 days. Run once in the SQL Editor.
- `supabase/functions/waitlist/index.ts`: the Edge Function the form talks to. It saves the address
  and sends the confirmation email through Resend. `/confirm/?t=…` confirms it.
- Secret in Supabase → Edge Functions → Secrets: `RESEND_API_KEY` (Resend key with sending access only).
  Optional `MAIL_FROM` (default `Awa <hello@getawa.app>`).
- Deploy: `npx supabase@latest functions deploy waitlist --project-ref aqodeoaxcuhivxesfxbb --no-verify-jwt --use-api`
- See the list: `select email, created_at, confirmed_at from waitlist.people order by created_at;`
