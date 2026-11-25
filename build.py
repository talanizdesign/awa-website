"""Builds getawa.app into public/ (what Cloudflare Pages serves).

Run:  python3 build.py          -> public/  (the live site)
      python3 build.py --dev    -> .dev/    (same page + test hooks, for local checks; not committed)

Sources: src/base.css + src/site.css -> styles.css, src/form.js + src/site.js -> main.js.
"""
import shutil, sys
from pathlib import Path

HERE = Path(__file__).parent
DEV = '--dev' in sys.argv
OUT = HERE / ('.dev' if DEV else 'public')

LOGO = '''<svg class="logo__mark" viewBox="0 0 32 32" aria-hidden="true"><g stroke="#D6CFC7" stroke-width="1.1" stroke-linecap="round"><path d="M16.00 11.00L16.00 5.50"/><path d="M18.50 11.67L21.25 6.91"/><path d="M20.33 13.50L25.09 10.75"/><path d="M21.00 16.00L26.50 16.00"/><path d="M20.33 18.50L25.09 21.25"/><path d="M18.50 20.33L21.25 25.09"/><path d="M16.00 21.00L16.00 26.50"/><path d="M13.50 20.33L10.75 25.09"/><path d="M11.67 18.50L6.91 21.25"/><path d="M11.00 16.00L5.50 16.00"/><path d="M11.67 13.50L6.91 10.75"/><path d="M13.50 11.67L10.75 6.91"/></g><circle cx="16.00" cy="3.00" r="2.6" fill="#72B172"/><circle cx="22.50" cy="4.74" r="2.1" fill="#FF9E7D"/><circle cx="27.26" cy="9.50" r="2.1" fill="#5B7D60"/><circle cx="29.00" cy="16.00" r="2.6" fill="#65A0FE"/><circle cx="27.26" cy="22.50" r="2.1" fill="#E57E73"/><circle cx="22.50" cy="27.26" r="2.1" fill="#72B172"/><circle cx="16.00" cy="29.00" r="2.6" fill="#FF9E7D"/><circle cx="9.50" cy="27.26" r="2.1" fill="#5B7D60"/><circle cx="4.74" cy="22.50" r="2.1" fill="#E57E73"/><circle cx="3.00" cy="16.00" r="2.6" fill="#72B172"/><circle cx="4.74" cy="9.50" r="2.1" fill="#65A0FE"/><circle cx="9.50" cy="4.74" r="2.1" fill="#FF9E7D"/></svg><span class="logo__word">awa</span>'''

TITLE = 'Awa: How apps make you feel'
DESC = 'How do your apps make you feel? Awa gives you a simple way to notice. Join the waiting list for the iPhone app.'
URL = 'https://getawa.app/'

def head():
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{TITLE}</title>
<meta name="description" content="{DESC}">
<link rel="canonical" href="{URL}">
<meta name="theme-color" content="#1F4080">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Awa">
<meta property="og:title" content="{TITLE}">
<meta property="og:description" content="{DESC}">
<meta property="og:url" content="{URL}">
<meta property="og:image" content="{URL}og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/BricolageGrotesque_700Bold.ttf" as="font" type="font/ttf" crossorigin>
<link rel="stylesheet" href="/styles.css">
</head>
<body>
'''

def join(i, label='Join'):
    # Same form in the hero and at the end (Teresa 2026-11-25): "Join", no note under the field.
    return f'''<form class="join glass-join" id="join-{i}" novalidate>
  <div class="join__row">
    <label class="sr" for="email-{i}">Your email</label>
    <input id="email-{i}" type="email" name="email" placeholder="Your email" autocomplete="email" aria-describedby="err-{i}">
    <button class="btn btn--primary" type="submit">{label}</button>
  </div>
  <p class="join__err" id="err-{i}" role="alert">Enter a valid email address.</p>
  <div class="join__ok" tabindex="-1" role="status"><b>Check your inbox.</b>We sent you an email. Confirm it to join the list.</div>
</form>'''


HERO_H1 = 'How do your apps make you feel?'
HERO_P = 'Awa gives you a simple way to notice.'
GOOD = ('All your feelings count.', 'Log the apps that bring you joy or calm, and the ones that leave you tired or restless. Knowing both helps you decide.')
WHEN = ('Log when you feel like it.', 'No reminders, no streaks. You open Awa when an app made you feel something. Awa shows you how you feel, and what you do with your apps is always up to you.')

PRIV = '''<ul class="priv">
  <li><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg><span>Only you can see your logs.</span></li>
  <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.7 5.1A10.7 10.7 0 0 1 21.9 12a10.8 10.8 0 0 1-2.4 3.3M14.1 14.2a3 3 0 0 1-4.2-4.2M17.5 17.5A10.7 10.7 0 0 1 2.1 12a10.8 10.8 0 0 1 4.4-5.5M2 2l20 20"/></svg><span>Awa never sees inside your apps. You choose what to log and when.</span></li>
  <li><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"/></svg><span>Your data is stored in the EU.</span></li>
  <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9.5 7V5h5v2M7 7l1 12.5h8L17 7"/></svg><span>Delete your account whenever you want, and your logs go with it.</span></li>
</ul>'''

TERESA = '''I'm a designer with a PhD from the University of Padova in Italy, where I researched how products make people feel. I wrote a book about it, <em>Emotion-Driven Innovation</em> (Springer, 2024). Awa is that research turned into something you can use every day.'''

FAQ_ITEMS = [
    ('Is Awa free?', 'Yes, Awa is free to download.'),
    ('Do I have to log every time I use an app?', 'No. Log when you feel like it, good feelings and bad ones.'),
    ('Which apps can I log?', 'Any app from the App Store, including the ones you pay for.'),
    ('Is it on Android?', 'Not yet. Awa is for iPhone first.'),
    ('When is it out?', "Soon. Join the waiting list and we'll email you on the day."),
]
FAQ = '<div class="faq">' + ''.join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in FAQ_ITEMS) + '</div>'

FOOT = f'''<footer class="foot">
  <div class="wrap foot__in">
    <div class="foot__me">
      <h2 class="foot__h">Hi, I'm Teresa.</h2>
      <p>{TERESA}</p>
      <a href="https://books.apple.com/us/book/emotion-driven-innovation/id6478436705" rel="noopener" target="_blank">About the book</a>
    </div>
    <div class="foot__base">
      <span>© 2026 Teresa Alaniz</span>
      <nav aria-label="Footer"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:hello@getawa.app">Support: hello@getawa.app</a></nav>
    </div>
  </div>
</footer>'''


SCRIPTS = (('<script>window.AWA_DEV = true;</script>\n' if DEV else '')
           + '<script src="/main.js" defer></script>'
           + ('\n<script src="/dev-hooks.js" defer></script>' if DEV else ''))

def page():
    scripts = SCRIPTS
    return head() + f'''<div class="hero-pin">
<section class="hero" aria-labelledby="hero-h">
  <header class="top"><div class="top__bar">
    <a class="logo" href="/" aria-label="Awa, home">{LOGO}</a>
    <a class="top__link" href="#join-end">Waiting list</a>
  </div></header>
  <canvas class="hero__bg" aria-hidden="true"></canvas>
  <span class="glow glow--1" aria-hidden="true"></span><span class="glow glow--2" aria-hidden="true"></span><span class="glow glow--3" aria-hidden="true"></span>
  <canvas class="hero__back" aria-hidden="true"></canvas>
  <div class="wrap hero__copy">
    <h1 class="h1" id="hero-h">{HERO_H1}</h1>
    <p class="lead">{HERO_P}</p>
    <div class="cta">
      <button class="btn cta__open" type="button" aria-expanded="false" aria-controls="join-top">Join the waiting list</button>
      {join('top')}
    </div>
  </div>
  <p class="hero__hint" aria-hidden="true"><span class="hint-a">Scroll to grow the meadow</span><span class="hint-b">Move through it. Tap a seed.</span></p>
  <canvas class="hero__canvas" aria-hidden="true"></canvas>
</section>
</div>

<main>
  <section class="story" aria-label="Screen time and Awa, the same week">
    <div class="story__stage">
      <span class="glow sglow--1" aria-hidden="true"></span><span class="glow sglow--2" aria-hidden="true"></span><span class="glow sglow--3" aria-hidden="true"></span>
      <canvas class="story__far" aria-hidden="true"></canvas>
      <canvas class="story__near" aria-hidden="true"></canvas>
      <div class="story__lines">
        <p class="story__line">Screen time counts minutes.</p>
        <p class="story__line"><span class="grey">Ten minutes on Monday.</span> An hour on Sunday.</p>
        <p class="story__line">But how did it feel?</p>
        <p class="story__line">Awa shows how you felt.</p>
      </div>
      <p class="sr">The same week, read two ways. Screen time: 10 minutes on Monday and 1 hour on Sunday. Awa: the 10 minutes on Monday felt like frustration, and the hour on Sunday felt like joy. The other days were mostly good.</p>
    </div>
  </section>

  <div class="soft">
  <span class="blob blob--1" aria-hidden="true"></span><span class="blob blob--2" aria-hidden="true"></span><span class="blob blob--3" aria-hidden="true"></span><span class="blob blob--4" aria-hidden="true"></span>
  <section class="wrap sec try" aria-labelledby="try-h">
    <div class="centered"><h2 class="h2" id="try-h">So, how does Awa work?</h2><p class="lead">Try it here. It takes a few seconds.</p></div>
    <div class="try__tiles">
      <div class="try__tile glass">
        <p class="try__num">1 · Log</p>
        <h3 class="try__q" id="try-q">How did this app make you feel?</h3>
        <div class="try__chips" role="group" aria-labelledby="try-q">
          <button type="button" class="try__chip" data-feel="Inspiration" aria-pressed="false"><svg viewBox="9 9 22 22" fill="none" aria-hidden="true"><path d="M25 22C25.3333 21 26.1667 20.3 27.5 19.5C29.1667 18.6 30 17.3 30 16C30 14.4087 28.9464 12.8826 27.0711 11.7574C25.1957 10.6321 22.6522 10 20 10C17.3478 10 14.8043 10.6321 12.9289 11.7574C11.0536 12.8826 10 14.4087 10 16C10 17 10.3333 18.2 12.5 19.5C13.6667 20.2 14.6667 21 15 22M15 26H25M16.6667 30H23.3333" stroke-width="1.5" stroke-linecap="round" stroke="currentColor"/></svg>Inspiration</button>
          <button type="button" class="try__chip" data-feel="Amusement" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M18 13a6 6 0 0 1-6 5 6 6 0 0 1-6-5h12Z"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>Amusement</button>
          <button type="button" class="try__chip is-bad" data-feel="Boredom" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>Boredom</button>
          <button type="button" class="try__chip is-bad" data-feel="Restlessness" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>Restlessness</button>
        </div>
        <p class="try__hint">Tap one</p>
      </div>
      <div class="try__tile glass">
        <p class="try__num">2 · See</p>
        <h3 class="try__q">Your log, on the home screen</h3>
        <ol class="try__logs" aria-live="polite">
          <li class="try__log try__log--new"><span class="try__date"><b></b><span></span></span><span class="try__ic"></span><span class="try__what"><b></b><span>This app</span></span></li>
          <li class="try__log try__log--empty" aria-hidden="true"><span class="try__date"></span><span class="try__ic"></span><span class="try__what">Your log appears here</span></li>
          <li class="try__log" data-old="1"><span class="try__date"><b></b><span></span></span><span class="try__ic"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /> <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg></span><span class="try__what"><b>Relaxation</b><span>Music app</span></span></li>
          <li class="try__log" data-old="1"><span class="try__date"><b></b><span></span></span><span class="try__ic"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /> <path d="m9 12 2 2 4-4" /></svg></span><span class="try__what"><b>Confidence</b><span>Notes app</span></span></li>
          <li class="try__log" data-old="2"><span class="try__date"><b></b><span></span></span><span class="try__ic is-bad"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="10" x="2" y="7" rx="2" ry="2" /> <line x1="22" x2="22" y1="11" y2="13" /> <line x1="6" x2="6" y1="11" y2="13" /></svg></span><span class="try__what"><b>Exhaustion</b><span>Email app</span></span></li>
          <li class="try__log" data-old="3"><span class="try__date"><b></b><span></span></span><span class="try__ic"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8" /> <path d="m4.93 10.93 1.41 1.41" /> <path d="M2 18h2" /> <path d="M20 18h2" /> <path d="m19.07 10.93-1.41 1.41" /> <path d="M22 22H2" /> <path d="m8 6 4-4 4 4" /> <path d="M16 18a4 4 0 0 0-8 0" /></svg></span><span class="try__what"><b>Hope</b><span>Podcast app</span></span></li>
        </ol>
      </div>
      <div class="try__tile glass">
        <p class="try__num">3 · Decide</p>
        <h3 class="try__q">Awa's insight, to help you decide</h3>
        <svg class="try__clock" viewBox="0 0 240 240" aria-hidden="true"></svg>
        <p class="try__cap">Log a feeling to see the insight</p>
        <div class="try__insight" aria-live="polite"><p class="try__title"></p><p class="try__body"></p></div>
      </div>
    </div>
  </section>

  <section class="wrap sec rows">
    <div class="row"><h2 class="st">{GOOD[0]}</h2><p class="lead">{GOOD[1]}</p></div>
    <div class="row"><h2 class="st">{WHEN[0]}</h2><p class="lead">{WHEN[1]}</p></div>
    <div class="row" aria-labelledby="priv-h"><h2 class="st" id="priv-h">What you log is yours.</h2>{PRIV.replace('<li><svg', '<li><span class="priv__ic"><svg').replace('</svg><span>', '</svg></span><span>')}</div>
  </section>

  <section class="wrap sec" style="padding-top:0" aria-labelledby="q-h">
    <div class="centered"><h2 class="h2" id="q-h">Questions</h2></div>
    <div class="qa">{FAQ}</div>
  </section>
  </div>

  <section class="final" id="join-end" aria-labelledby="f-h">
    <canvas class="field-canvas" aria-hidden="true"></canvas>
    <div class="wrap"><div class="centered final__card"><h2 class="h2" id="f-h">Be the first to know.</h2>{join('end')}</div></div>
  </section>
</main>
''' + FOOT + f'''
{scripts}
</body>
</html>'''


OUT.mkdir(exist_ok=True)
(OUT / 'index.html').write_text(page())
(OUT / 'styles.css').write_text((HERE / 'src/base.css').read_text() + '\n' + (HERE / 'src/site.css').read_text())
(OUT / 'main.js').write_text((HERE / 'src/form.js').read_text() + '\n' + (HERE / 'src/site.js').read_text())
if DEV:
    shutil.copy(HERE / 'src/dev-hooks.js', OUT / 'dev-hooks.js')
    for f in ['fonts', 'favicon.png', 'apple-touch-icon.png', 'og.png']:
        p = HERE / 'public' / f
        if p.is_dir(): shutil.copytree(p, OUT / f, dirs_exist_ok=True)
        elif p.exists(): shutil.copy(p, OUT / f)
print('built', OUT.relative_to(HERE))
