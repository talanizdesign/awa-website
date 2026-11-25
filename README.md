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
