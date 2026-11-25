/* getawa.app: hero meadow, scroll story, Try it, final meadow. */
(function () {
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var C = {
    t300: '#C7D9C7', t500: '#72B172', t700: '#5B7D60', s100: '#FFF1E8', s300: '#FFE4D6', s500: '#FF9E7D', s700: '#E57E73', s900: '#AD5047',
    p300: '#B2D4FF', p500: '#65A0FE', p700: '#4073CC', p900: '#1F4080', n700: '#615952', grey: '#C9C9CD', greyHot: '#A3A3A8'
  };
  var GOOD = [C.t500, C.t700], BAD = [C.s700, C.s500];
  var FONT = '"Bricolage Grotesque", system-ui, sans-serif';
  function clamp(v, a, b) { return Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function back(t) { var c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  function mix(c1, c2, t) {
    var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    var r = Math.round(lerp(a >> 16, b >> 16, t)), g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t)), bl = Math.round(lerp(a & 255, b & 255, t));
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }
  function rng(seed) { return function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }
  function fit(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }
  function pill(ctx, x, y, text, color, border) {
    ctx.font = '600 14px ' + FONT;
    var tw = ctx.measureText(text).width, pw = tw + 20, ph = 26;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = border; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x - pw / 2, y - ph, pw, ph, 13); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y - ph / 2 + 1);
  }

  /* ---------------------------------------------------------- a swaying meadow */
  function Meadow(canvas, opts) {
    var self = this;
    this.canvas = canvas; this.navy = opts.tone === 'navy'; this.seed = opts.seed || 3;
    this.stems = []; this.planted = []; this.floaters = []; this.t = 0; this.running = false; this.lastSpawn = 0;
    this.resize();
    window.addEventListener('resize', function () { self.resize(); });
    // Brushing: only the stems the pointer touches bend, then spring back (Teresa 2026-11-24).
    if (!still) {
      (opts.windOn || canvas).addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
        var p = self.ptr;
        self.ptr = { x: x, y: y, vx: p && now - p.at < 80 ? x - p.x : 0, at: now };
      });
      (opts.windOn || canvas).addEventListener('pointerleave', function () { self.ptr = null; });
    }
    new IntersectionObserver(function (es) { self.running = es[0].isIntersecting; if (self.running) self.loop(); }).observe(canvas);
  }
  Meadow.prototype.resize = function () {
    var f = fit(this.canvas); this.ctx = f.ctx; this.w = f.w; this.h = f.h;
    var r = rng(this.seed), step = this.w < 600 ? 24 : 32, stems = [];
    for (var x = step * 0.6; x < this.w; x += step * (0.75 + r() * 0.5)) {
      var n = 1 + Math.floor(r() * 3), bad = r() < 0.27 ? 1 + Math.floor(r() * n) : 0, dots = [], j;
      for (j = 0; j < bad; j++) dots.push(this.navy ? C.p700 : BAD[j % 2]);
      for (j = 0; j < n - bad; j++) dots.push(this.navy ? [C.p300, C.p500, '#ffffff'][Math.floor(r() * 3)] : GOOD[j % 2]);
      stems.push({ x: x, len: this.h * (0.22 + r() * 0.5), dots: dots, ph: r() * 6.28, sp: 0.6 + r() * 0.6, r: 5.5 });
    }
    var self = this;
    this.stems = stems.filter(function (s) { return !self.planted.some(function (p) { return Math.abs(p.x / p.w0 * self.w - s.x) < 18; }); });
    this.planted.forEach(function (p) { p.x = p.x / p.w0 * self.w; p.w0 = self.w; });
    if (still || !this.running) this.draw(0);
  };
  Meadow.prototype.plant = function (good, name) {
    var w = this.w, x, tries = 0, self = this;
    do { x = w / 2 + (Math.random() - 0.5) * w * 0.6; tries++; }
    while (tries < 20 && this.planted.some(function (p) { return Math.abs(p.x - x) < 40; }));
    this.stems = this.stems.filter(function (s) { return Math.abs(s.x - x) > 20; });
    this.planted.forEach(function (p) { p.label = false; });
    this.planted.push({ x: x, w0: w, len: this.h * (0.55 + Math.random() * 0.2), dots: [good ? C.t500 : C.s700], ph: Math.random() * 6, sp: 0.8, r: 9,
      born: performance.now(), label: name, good: good });
    for (var i = 0; i < 6 && !still; i++) this.spawn(x, this.h * 0.4, good ? C.t500 : C.s700);
    if (still || !this.running) this.draw(performance.now());
  };
  Meadow.prototype.spawn = function (x, y, color) {
    this.floaters.push({ x: x, y: y, vx: 0.2 + Math.random() * 0.5, vy: -0.25 - Math.random() * 0.35, ph: Math.random() * 6, life: 0, max: 380 + Math.random() * 260, c: color, r: 2.5 + Math.random() * 1.5 });
  };
  Meadow.prototype.stem = function (s, now, grow) {
    var ctx = this.ctx, H = this.h, amp = still ? 0 : 0.045;
    var L = s.len * grow, a = Math.sin(this.t * s.sp + s.ph) * amp + (s.bend || 0);
    var tx = s.x + Math.sin(a) * L, ty = H - Math.cos(a) * L;
    ctx.strokeStyle = this.navy ? 'rgba(178,212,255,.35)' : C.t300; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(s.x, H); ctx.quadraticCurveTo(s.x, H - L * 0.5, tx, ty); ctx.stroke();
    var dx = Math.sin(a), dy = -Math.cos(a), gap = s.r * 2 + 3;
    var pop = s.born ? back(clamp((now - s.born - 700) / 500)) : 1;
    for (var k = 0; k < s.dots.length; k++) {
      ctx.fillStyle = s.dots[k];
      ctx.beginPath(); ctx.arc(tx + dx * (s.r + k * gap), ty + dy * (s.r + k * gap), Math.max(0, s.r * pop), 0, 6.283); ctx.fill();
    }
    return { x: tx + dx * (s.r * 2 + (s.dots.length - 1) * gap), y: ty + dy * (s.r * 2 + (s.dots.length - 1) * gap) };
  };
  Meadow.prototype.draw = function (now) {
    var ctx = this.ctx, self = this;
    ctx.clearRect(0, 0, this.w, this.h);
    this.stems.forEach(function (s) { s.top = self.stem(s, now, 1); });
    this.planted.forEach(function (p) {
      var g = still ? 1 : back(clamp((now - p.born) / 1100));
      var top = self.stem(p, now, g);
      if (p.label && (still || now - p.born > 1100)) pill(ctx, top.x, top.y - 10, p.label, p.good ? '#335438' : C.s900, p.good ? C.t300 : C.s300);
    });
    this.floaters.forEach(function (f) {
      var a = 1 - f.life / f.max;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
      ctx.strokeStyle = f.c; ctx.lineWidth = 0.8;
      for (var k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + k * 4, f.y - 6); ctx.stroke(); }
      ctx.globalAlpha = 1;
    });
  };
  Meadow.prototype.brush = function (now) {
    var p = this.ptr, H = this.h, self = this, fresh = p && now - p.at < 60;
    this.stems.concat(this.planted).forEach(function (s) {
      s.bend = s.bend || 0; s.bv = s.bv || 0;
      if (fresh && p.vx) {
        var L = s.len, h = H - p.y;                         // pointer height above the ground
        if (h > -10 && h < L + 24) {
          var sx = s.x + Math.sin(s.bend) * Math.max(0, h);  // where the stem is at that height
          var d = Math.abs(p.x - sx), reach = 26;
          if (d < reach) {
            var push = p.vx * 0.0045 * (1 - d / reach) * (0.4 + h / L);
            s.bv += clamp(push, -0.08, 0.08);
            if (Math.abs(p.vx) > 9 && Math.random() < 0.12 && s.top) self.spawn(s.top.x, s.top.y, s.dots[s.dots.length - 1]);
          }
        }
      }
      s.bv += -s.bend * 0.05; s.bv *= 0.9; s.bend = clamp(s.bend + s.bv, -0.5, 0.5);
    });
  };
  Meadow.prototype.loop = function () {
    var self = this;
    if (still || this.looping) return;
    this.looping = true;
    (function frame(now) {
      if (!self.running) { self.looping = false; return; }
      self.t = now / 1000;
      self.brush(now);
      if (now - self.lastSpawn > 1100 && self.stems.length) {
        var s = self.stems[Math.floor(Math.random() * self.stems.length)];
        if (s.top) self.spawn(s.top.x, s.top.y, s.dots[s.dots.length - 1]);
        self.lastSpawn = now;
      }
      self.floaters.forEach(function (f) { f.life++; f.x += f.vx; f.y += f.vy + Math.sin(f.life / 30 + f.ph) * 0.3; });
      self.floaters = self.floaters.filter(function (f) { return f.life < f.max && f.x < self.w + 20 && f.y > -20; });
      self.draw(now);
      requestAnimationFrame(frame);
    })(performance.now());
  };

  /* ---------------------------------------------------------- hero: the meadow grows
     Navy, only bare ground. The first scrolls don't move the page: they grow the meadow from the
     ground up (Teresa 2026-11-24). Then the pointer bends only the stems it touches, and now and
     then a brushed seed lets go: it floats up, takes its real colour, and its emotion appears as a
     plain word. Clicking or tapping a seed always releases it. It grows back after a few seconds. */
  var EMO = [
    ['Joy', 1], ['Relief', 1], ['Confidence', 1], ['Inspiration', 1], ['Amusement', 1], ['Hope', 1], ['Pride', 1], ['Relaxation', 1], ['Vitality', 1], ['Empathy', 1],
    ['Frustration', 0], ['Anxiety', 0], ['Boredom', 0], ['Exhaustion', 0], ['Distress', 0], ['Sadness', 0], ['Restlessness', 0], ['Disillusionment', 0]
  ];
  var NAVY_DOTS = [C.p300, C.p500, '#FFFFFF'];
  function Grow(hero) {
    var self = this;
    this.hero = hero; this.pin = hero.parentElement; this.canvas = hero.querySelector('.hero__canvas'); this.bgCanvas = hero.querySelector('.hero__bg'); this.backCanvas = hero.querySelector('.hero__back'); this.copy = hero.querySelector('.hero__copy'); this.px = 0;
    this.floaters = []; this.t = 0; this.g = still ? 1 : 0; this.running = false; this.ptr = null; this.wake = 0; this.wp = 0;
    this.layout();
    window.addEventListener('resize', function () { self.layout(); self.draw(); });
    if (document.fonts) document.fonts.ready.then(function () { self.layout(); self.draw(); });
    hero.addEventListener('pointermove', function (e) {
      var p = self.local(e), now = performance.now(), q = self.ptr, live = q && now - q.at < 80;
      self.ptr = { x: p.x, y: p.y, vx: live ? p.x - q.x : 0, vy: live ? p.y - q.y : 0, at: now };
      self.canvas.style.cursor = self.hit(p.x, p.y) ? 'pointer' : 'default';
    });
    hero.addEventListener('pointerleave', function () { self.ptr = null; });
    this.canvas.addEventListener('click', function (e) { var p = self.local(e), h = self.hit(p.x, p.y, 24); if (self.g > 0.97 && p.y > self.h - self.room(p.x) - 40) self.startWake(p.x, p.y); if (h) self.release(h); });
    window.addEventListener('scroll', function () { if (!self.running) { self.update(performance.now()); self.draw(); } }, { passive: true });
    new IntersectionObserver(function (es) { self.running = es[0].isIntersecting; if (self.running) self.loop(); }).observe(hero);
  }
  Grow.prototype.local = function (e) { var r = this.canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  Grow.prototype.layout = function () {
    var oldW = this.w, f = fit(this.canvas); this.ctx = f.ctx; this.w = f.w; this.h = f.h;
    this.bctx = fit(this.bgCanvas).ctx; this.kctx = fit(this.backCanvas).ctx;
    // The meadow stays below the text on the left, and grows taller on the right where there is room.
    var hr = this.hero.getBoundingClientRect(), right = 0, bottom = 0;
    Array.prototype.forEach.call(this.copy.children, function (el) { var r = el.getBoundingClientRect(); right = Math.max(right, r.right); bottom = Math.max(bottom, r.bottom); });
    this.cBottom = bottom - hr.top + 28; this.cRight = right - hr.left + 40; this.wide = this.w >= 760;
    if (oldW !== this.w || !this.stems) this.makeStems();
    else { var self = this; this.stems.concat(this.back).forEach(function (s) { s.len = self.room(s.x) * s.lf; }); }
  };
  Grow.prototype.room = function (x) {
    var below = Math.max(140, this.h - this.cBottom);
    if (!this.wide || x < this.cRight) return below;
    return Math.max(below, Math.min(this.h - 120, below + (x - this.cRight) * 1.4));   // rises to full height just right of the text
  };
  Grow.prototype.makeStems = function () {
    var self = this, cx = this.w / 2;
    function field(seed, step, lo, hi) {
      var r = rng(seed), list = [];
      for (var x = 8; x < self.w; x += step * (0.7 + r() * 0.6)) {
        var n = 1 + Math.floor(r() * 3), dots = [], bad = r() < 0.3 ? 1 + Math.floor(r() * n) : 0;
        for (var j = 0; j < n; j++) {
          var isBad = j < bad, pool = EMO.filter(function (e) { return !e[1] === isBad; }), e = pool[Math.floor(r() * pool.length)];
          dots.push({ name: e[0], real: isBad ? BAD[j % 2] : GOOD[j % 2], navy: NAVY_DOTS[Math.floor(r() * 3)], on: true, re: 1, back: 0 });
        }
        var lf = lo + r() * (hi - lo);
        // grows from the middle out, with some randomness, so it feels alive rather than a wipe
        list.push({ x: x, lf: lf, len: self.room(x) * lf, dots: dots, ph: r() * 6.28, sp: 0.6 + r() * 0.6, bend: 0, bv: 0, gr: 0, local: 0,
          ord: clamp(0.55 * Math.abs(x - cx) / cx + 0.45 * r()) });
      }
      return list;
    }
    this.stems = field(13, this.w < 600 ? 16 : 21, 0.15, 0.72);   // near meadow: sharp, can be touched
    this.back = field(31, this.w < 600 ? 13 : 16, 0.35, 0.98);    // far meadow: taller, blurred, smaller seeds
  };
  Grow.prototype.target = function () {
    if (still) return 1;
    var total = this.pin.offsetHeight - window.innerHeight;
    if (total <= 0) return 1;
    return clamp(-this.pin.getBoundingClientRect().top / total / 0.8);   // the last 20% of the pin is a pause on the full meadow
  };
  Grow.prototype.hit = function (x, y, rad) {
    var best = null, bd = rad || 14;
    this.stems.forEach(function (s) {
      (s.pos || []).forEach(function (p, j) {
        var d = s.dots[j];
        if (!d.on || d.re < 1 || s.local < 0.95) return;
        var dist = Math.hypot(p.x - x, p.y - y);
        if (dist < bd) { bd = dist; best = { dot: d, x: p.x, y: p.y }; }
      });
    });
    return best;
  };
  Grow.prototype.release = function (h) {
    h.dot.on = false; h.dot.re = 0; h.dot.back = performance.now() + 5000;
    this.floaters.push({ x: h.x, y: h.y, age: 0, ph: Math.random() * 6, name: h.dot.name, real: h.dot.real, navy: h.dot.navy, good: GOOD.indexOf(h.dot.real) > -1, side: h.x > this.w * 0.72 ? -1 : 1 });
    this.hero.classList.add('is-played');
    if (still) this.draw();
  };
  /* Once the meadow has grown, moving through it wakes it up: white spreads out from the pointer
     until it fills the whole hero, top to bottom, and the stems and seeds take their colours. */
  Grow.prototype.startWake = function (x, y) {
    if (this.wake) return;
    this.wake = performance.now(); this.wx = x; this.wy = y;
    this.wR = Math.max(Math.hypot(x, y), Math.hypot(this.w - x, y), Math.hypot(x, this.h - y), Math.hypot(this.w - x, this.h - y)) + 120;
  };
  Grow.prototype.reveal = function (x, y) {
    if (!this.wake) return 0;
    if (this.wp >= 1) return 1;
    return clamp((this.wp * this.wR - Math.hypot(x - this.wx, y - this.wy)) / 100);
  };
  Grow.prototype.update = function (now) {
    var self = this, k = clamp((now - (this.lastFrame || now)) / 16.67, 0, 3), p = this.ptr, H = this.h;
    this.lastFrame = now;
    var G = this.target();
    this.g += (G - this.g) * Math.min(1, 0.12 * k);
    if (Math.abs(G - this.g) < 0.001) this.g = G;
    this.hero.classList.toggle('is-grown', this.g > 0.97);
    var fresh = p && now - p.at < 60, speed = p ? Math.hypot(p.vx, p.vy) : 0;
    if (!this.wake && this.g > 0.97 && fresh && speed > 2 && p.y > H - this.room(p.x) - 20) this.startWake(p.x, p.y);
    if (this.wake) this.wp = still ? 1 : ease(clamp((now - this.wake) / 1600));
    this.hero.classList.toggle('is-white', this.wp > 0.3);
    this.stems.forEach(function (s) {
      s.local = clamp((self.g - s.ord * 0.55) / 0.45);
      s.gr = 1 - Math.pow(1 - s.local, 3);
      var L = s.len * s.gr;
      if (fresh && p.vx && !still && s.gr > 0.3) {
        var h = H - p.y;
        if (h > -10 && h < L + 30) {
          var d = Math.abs(p.x - (s.x + Math.sin(s.bend) * Math.max(0, h)));
          if (d < 26) s.bv += clamp(p.vx * 0.0045 * (1 - d / 26) * (0.4 + h / L), -0.08, 0.08);
        }
        // brushing right through a seed sometimes lets it go
        (s.pos || []).forEach(function (q, j) {
          var dot = s.dots[j];
          if (dot.on && dot.re >= 1 && s.local > 0.95 && speed > 4 && Math.hypot(q.x - p.x, q.y - p.y) < 11 && Math.random() < 0.3) self.release({ dot: dot, x: q.x, y: q.y });
        });
      }
      s.bv += -s.bend * 0.05 * k; s.bv *= Math.pow(0.9, k); s.bend = clamp(s.bend + s.bv * k, -0.5, 0.5);
      s.dots.forEach(function (d) {
        if (!d.on && now > d.back) d.on = true;
        if (d.on && d.re < 1) d.re = Math.min(1, d.re + 0.04 * k);
      });
    });
    this.back.forEach(function (s) { s.local = clamp((self.g - s.ord * 0.55) / 0.45); s.gr = 1 - Math.pow(1 - s.local, 3); });
    // the far meadow shifts a little against the pointer, slower than the near one: depth
    var tx = p && !still ? (p.x - this.w / 2) * -0.03 : 0;
    this.px += (tx - this.px) * Math.min(1, 0.06 * k);
    this.backCanvas.style.transform = 'translate3d(' + this.px.toFixed(2) + 'px,0,0)';
    this.floaters.forEach(function (f) { f.age += k; f.y -= 0.55 * k; f.x += Math.sin(f.age / 24 + f.ph) * 0.45 * k; });
    this.floaters = this.floaters.filter(function (f) { return f.age < 240; });
  };
  Grow.prototype.draw = function () {
    var ctx = this.ctx, self = this, H = this.h, W = this.w, amp = still ? 0 : 0.04;
    // background layer: navy, then white spreading from where you woke it up
    var bg = this.bctx;
    bg.fillStyle = C.p900; bg.fillRect(0, 0, W, H);
    if (this.wake) {
      if (this.wp >= 1) { bg.fillStyle = '#fff'; bg.fillRect(0, 0, W, H); }
      else {
        var R = this.wp * this.wR, grad = bg.createRadialGradient(this.wx, this.wy, Math.max(0, R - 100), this.wx, this.wy, R);
        grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
        bg.fillStyle = grad; bg.fillRect(0, 0, W, H);
      }
    }
    function stem(c, s, r, ox, oy, keep) {
      if (keep) s.pos = [];
      if (s.gr <= 0.005) return;
      var a = Math.sin(self.t * s.sp + s.ph) * amp * s.gr + s.bend, L = s.len * s.gr;
      var tx = s.x + Math.sin(a) * L, ty = H - Math.cos(a) * L;
      c.strokeStyle = mix('#688ABF', C.t300, self.reveal(tx, ty)); c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(s.x + ox, H + oy); c.quadraticCurveTo(s.x + ox, H - L * 0.5 + oy, tx + ox, ty + oy); c.stroke();
      var dx = Math.sin(a), dy = -Math.cos(a), gap = r * 2 + 3;
      s.dots.forEach(function (dot, j) {
        var px = tx + dx * (r + j * gap), py = ty + dy * (r + j * gap);
        if (keep) s.pos.push({ x: px, y: py });
        if (!dot.on) return;
        var sc = back(clamp((s.local - 0.7 - j * 0.08) / 0.22)) * back(dot.re);
        if (sc <= 0) return;
        c.fillStyle = mix(dot.navy, dot.real, self.reveal(px, py)); c.beginPath(); c.arc(px + ox, py + oy, r * sc, 0, 6.283); c.fill();
      });
    }
    // far meadow (its canvas is blurred in CSS and 16px bigger on each side)
    var k = this.kctx;
    k.clearRect(0, 0, W + 32, H + 32);
    this.back.forEach(function (s) { stem(k, s, 4.5, 16, 16, false); });
    // near meadow
    ctx.clearRect(0, 0, W, H);
    this.stems.forEach(function (s) {
      // the bare ground: a small bud where each stem will come up
      ctx.fillStyle = mix('#5470A8', C.t300, self.reveal(s.x, H)); ctx.beginPath(); ctx.arc(s.x, H - 2, 1.6, 0, 6.283); ctx.fill();
      stem(ctx, s, 6, 0, 0, true);
    });
    // released seeds float up, take their colour, and say their emotion
    ctx.font = '300 15px ' + FONT; ctx.textBaseline = 'middle';
    this.floaters.forEach(function (f) {
      var alpha = clamp((240 - f.age) / 70);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = mix(f.navy, f.real, Math.max(self.reveal(f.x, f.y), clamp(f.age / 24))); ctx.beginPath(); ctx.arc(f.x, f.y, 6.5, 0, 6.283); ctx.fill();
      ctx.globalAlpha = alpha * clamp((f.age - 6) / 22);
      ctx.fillStyle = mix('#FFFFFF', f.good ? '#335438' : C.s900, self.reveal(f.x, f.y)); ctx.textAlign = f.side > 0 ? 'left' : 'right';
      ctx.fillText(f.name, f.x + f.side * 13, f.y);
      ctx.globalAlpha = 1;
    });
  };
  Grow.prototype.loop = function () {
    var self = this;
    if (this.looping) return;
    this.looping = true;
    (function frame(now) {
      if (!self.running) { self.looping = false; return; }
      self.t = now / 1000; self.update(now); self.draw();
      requestAnimationFrame(frame);
    })(performance.now());
  };
  var grow = new Grow(document.querySelector('.hero'));
  if (window.AWA_DEV) window.__grow = grow;   // local test hooks only (build.py --dev)

  /* ---------------------------------------------------------- hero call to action: one button that opens the email field */
  var cta = document.querySelector('.hero .cta'), openBtn = cta.querySelector('.cta__open');
  openBtn.addEventListener('click', function () {
    cta.classList.add('is-open'); openBtn.setAttribute('aria-expanded', 'true');
    var input = cta.querySelector('input'); if (input) input.focus();
  });


  /* ---------------------------------------------------------- story: minutes become feelings */
  var story = document.querySelector('.story'), sc = story.querySelector('.story__near'), farC = story.querySelector('.story__far'), lines = story.querySelectorAll('.story__line');
  var MIN = [10, 160, 180, 200, 125, 170, 60], MAXMIN = 200;
  // Monday: 10 minutes that felt bad. Sunday: 1 hour that felt good. Never tie a long screen time to a good feeling. (Teresa 2026-11-24: one good, one bad.)
  var LOGS = [[0, 1], [2, 0], [1, 0], [3, 0], [1, 0], [2, 0], [3, 0]];
  var DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  var HOT = [{ i: 0, mins: '10m', feel: 'Frustration', tint: '#FFF1E8', ink: C.s900 }, { i: 6, mins: '1h', feel: 'Joy', tint: '#EDF5ED', ink: '#335438' }];
  var S = { running: false, extra: [], far: [] };
  function meadowRow(r, step, lo, hi, skip) {
    var out = [];
    for (var x = step * 0.5; x < S.w; x += step * (0.8 + r() * 0.4)) {
      if (skip && skip(x)) continue;
      var n = 1 + Math.floor(r() * 3), bad = r() < 0.25 ? 1 : 0, dots = [], j;
      for (j = 0; j < bad; j++) dots.push(BAD[j % 2]);
      for (j = 0; j < n - bad; j++) dots.push(GOOD[j % 2]);
      out.push({ x: x, len: S.h * (lo + r() * (hi - lo)), dots: dots, ord: Math.abs(x - S.w / 2) / S.w + r() * 0.15, ph: r() * 6 });
    }
    return out;
  }
  function storyResize() {
    var f = fit(sc); S.ctx = f.ctx; S.w = f.w; S.h = f.h; S.fctx = fit(farC).ctx;
    var gap = Math.min(130, S.w / 8.2), cx = S.w / 2;
    S.gap = gap; S.xs = DAYS.map(function (d, i) { return cx + (i - 3) * gap; });
    S.extra = meadowRow(rng(11), S.w < 600 ? 22 : 30, 0.08, 0.3, function (x) {
      return S.xs.some(function (dx) { return Math.abs(dx - x) < 20; }) || Math.abs(x - S.xs[0]) < gap * 0.45 || Math.abs(x - S.xs[6]) < gap * 0.45;
    });
    S.far = meadowRow(rng(17), S.w < 600 ? 14 : 17, 0.15, 0.5);
    drawStory(performance.now());
  }
  function progress() {
    var rect = story.getBoundingClientRect(), total = story.offsetHeight - window.innerHeight;
    return clamp(-rect.top / total);
  }
  function stemAt(ctx, s, base, g, t, r) {
    var a = Math.sin(t * 0.8 + s.ph) * 0.04, L = s.len * g, tx = s.x + Math.sin(a) * L, ty = base - Math.cos(a) * L;
    ctx.strokeStyle = C.t300; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(s.x, base); ctx.quadraticCurveTo(s.x, base - L * 0.5, tx, ty); ctx.stroke();
    s.dots.forEach(function (c, k) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(tx + Math.sin(a) * (r + k * (r * 2 + 3)), ty - Math.cos(a) * (r + k * (r * 2 + 3)), r * g, 0, 6.283); ctx.fill(); });
  }
  function drawStory(now) {
    // everything happens in the first 76% of the scroll; the rest is a pause on the full meadow
    var p = clamp(progress() / 0.76), ctx = S.ctx, W = S.w, H = S.h, t = still ? 0 : now / 1000;
    var on = p < 0.22 ? 0 : p < 0.46 ? 1 : p < 0.86 ? 2 : 3;   // the last line waits for the full meadow
    lines.forEach(function (l, i) { l.classList.toggle('is-on', i === on); });
    ctx.clearRect(0, 0, W, H);
    var base = H * 0.86, maxBar = H * 0.4, bw = Math.min(52, S.gap * 0.5);
    var rise = ease(clamp(p / 0.14)), hot = clamp((p - 0.2) / 0.06), m = ease(clamp((p - 0.44) / 0.28));
    var seedIn = clamp((m - 0.5) / 0.5), tags = clamp((p - 0.72) / 0.05), fill = ease(clamp((p - 0.74) / 0.12));

    // far meadow, blurred by CSS, fills in at the end behind everything
    var fc = S.fctx; fc.clearRect(0, 0, W + 32, H + 32);
    fc.save(); fc.translate(16, 16);
    S.far.forEach(function (s) { var g = ease(clamp(fill * 1.6 - s.ord * 1.2)); if (g > 0) stemAt(fc, s, base, g, t, 4.5); });
    fc.restore();

    // Monday and Sunday: frosted glass panels, neutral while they are only minutes, tinted once they become feelings
    HOT.forEach(function (d) {
      var x = S.xs[d.i] - S.gap * 0.42, y = base - maxBar - 70, w = S.gap * 0.84, h = maxBar + 128;
      ctx.save(); ctx.globalAlpha = hot;
      ctx.shadowColor = 'rgba(31,64,128,.10)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
      ctx.fillStyle = 'rgba(242,237,232,.55)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 22); ctx.fill();
      ctx.shadowColor = 'transparent';
      if (m > 0) { ctx.globalAlpha = hot * m * 0.85; ctx.fillStyle = d.tint; ctx.fill(); ctx.globalAlpha = hot; }
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.strokeStyle = 'rgba(31,64,128,.06)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x - 0.5, y - 0.5, w + 1, h + 1, 22.5); ctx.stroke();
      ctx.restore();
    });
    // the near meadow fills in at the end
    S.extra.forEach(function (s) { var g = ease(clamp(fill * 1.8 - s.ord * 1.6)); if (g > 0) stemAt(ctx, s, base, g, t, 5); });
    // the seven days: bars that become stems
    S.xs.forEach(function (x, i) {
      var barH = Math.max(4, MIN[i] / MAXMIN * maxBar) * rise;
      var n = LOGS[i][0] + LOGS[i][1], stemH = H * 0.1 + n * H * 0.035;
      var w = lerp(bw, 1.5, m), h = lerp(barH, stemH, m);
      var d = HOT.filter(function (q) { return q.i === i; })[0], col = d ? mix(C.grey, C.greyHot, hot) : C.grey;
      var a = Math.sin(t * 0.9 + i) * 0.035 * m;
      ctx.save(); ctx.translate(x, base); ctx.rotate(a);
      ctx.fillStyle = m > 0 ? (m < 1 ? mixRgb(col, C.t300, m) : C.t300) : col;
      ctx.beginPath(); ctx.roundRect(-w / 2, -h, w, h, Math.min(w / 2, 8)); ctx.fill();
      // seeds bloom on top: not so good below, good above
      var dots = [], j;
      for (j = 0; j < LOGS[i][1]; j++) dots.push(BAD[j % 2]);
      for (j = 0; j < LOGS[i][0]; j++) dots.push(GOOD[j % 2]);
      dots.forEach(function (c, k) {
        var s = back(clamp(seedIn * 1.6 - k * 0.25));
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, -h - 8 - k * 17, Math.max(0, 7.5 * s), 0, 6.283); ctx.fill();
      });
      ctx.restore();
      // minutes, then feelings: plain words, no chips
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      if (d) {
        ctx.font = '500 17px ' + FONT; ctx.fillStyle = C.n700;
        ctx.globalAlpha = hot * clamp(1 - m * 4); ctx.fillText(d.mins, x, base - barH - 14);
        ctx.font = '300 15px ' + FONT; ctx.fillStyle = d.ink;
        ctx.globalAlpha = tags; ctx.fillText(d.feel, x, base - stemH - 26 - n * 17);
        ctx.globalAlpha = 1;
      }
      ctx.font = '600 15px ' + FONT; ctx.textBaseline = 'top';
      ctx.fillStyle = d && m > 0.5 ? d.ink : C.n700;
      ctx.fillText(DAYS[i], x, base + 14);
    });
  }
  function mixRgb(rgbOrHex, hex, t) {
    if (rgbOrHex[0] === '#') return mix(rgbOrHex, hex, t);
    var m = rgbOrHex.match(/\d+/g).map(Number), b = parseInt(hex.slice(1), 16);
    return 'rgb(' + Math.round(lerp(m[0], b >> 16, t)) + ',' + Math.round(lerp(m[1], (b >> 8) & 255, t)) + ',' + Math.round(lerp(m[2], b & 255, t)) + ')';
  }
  storyResize();
  window.addEventListener('resize', storyResize);
  window.addEventListener('scroll', function () { if (still || !S.running) drawStory(performance.now()); }, { passive: true });
  new IntersectionObserver(function (es) {
    S.running = es[0].isIntersecting && !still;
    if (S.running) (function frame(now) { if (!S.running) return; drawStory(now); requestAnimationFrame(frame); })(performance.now());
    else drawStory(performance.now());
  }).observe(story);

  /* ---------------------------------------------------------- so, how does Awa work? (drawn like the app)
     1 Log: the app's emotion pills. 2 See: the log appears at the top of the home list.
     3 Decide: the app's dandelion (30 stems, one per day, today at the top) and its insight. */
  var tr = document.querySelector('.try');
  if (tr) {
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var dayLabel = function (ago) { var d = new Date(Date.now() - ago * 864e5); return [String(d.getDate()), MONTHS[d.getMonth()]]; };
    tr.querySelectorAll('.try__log').forEach(function (li) {
      var ago = Number(li.dataset.old || 0), lab = dayLabel(ago), b = li.querySelector('.try__date b'), sp = li.querySelector('.try__date span');
      if (b) { b.textContent = lab[0]; sp.textContent = lab[1]; }
    });
    var FEEL = { Inspiration: 'inspired', Amusement: 'amused', Boredom: 'bored', Restlessness: 'restless' };
    // a month of logs for this app; today is the feeling just picked
    // a month of logs for this app, almost every day; [daysAgo, good, not so good]. Today is the feeling just picked.
    var GAPS = [4, 11, 19, 25];
    function month(good, mixRate, seed) {
      var r = rng(seed), out = [];
      for (var d = 0; d < 30; d++) {
        if (GAPS.indexOf(d) > -1) continue;
        var n = 1 + (r() < 0.3 ? 1 : 0), other = d > 0 && r() < mixRate ? 1 : 0;
        if (d === 0) n = 1;
        out.push(good ? [d, n, other] : [d, other, n]);
      }
      return out;
    }
    // One situation per emotion, so each pick reads differently. Lines come from the app's own copy options.
    var INSIGHT = {
      Inspiration:  { good: true,  days: month(true, 0, 5),     title: 'A steady lift lately',     body: 'This one lifts you. You feel inspired every time you log it.' },
      Amusement:    { good: true,  days: month(true, 0.18, 7),  title: 'Mostly good, a few dips',  body: 'You often leave this app feeling amused. Some moments leave you drained, but they are few.' },
      Boredom:      { good: false, days: month(false, 0.3, 9),  title: 'Worth a small change',     body: 'You feel amused here sometimes, but more often bored. A small change, like a shorter visit, could help.' },
      Restlessness: { good: false, days: month(false, 0, 11),   title: 'It’s okay to step away', body: 'This app has been leaving you restless. Try a day without it and see how you feel.' }
    };
    var svgNS = 'http://www.w3.org/2000/svg', clock = tr.querySelector('.try__clock');
    var cap = tr.querySelector('.try__cap'), title = tr.querySelector('.try__title'), body = tr.querySelector('.try__body');
    function el(name, attrs) { var n = document.createElementNS(svgNS, name); for (var k in attrs) n.setAttribute(k, attrs[k]); return n; }
    function drawClock(days, grow) {
      while (clock.firstChild) clock.removeChild(clock.firstChild);
      for (var d = 0; d < 30; d++) {
        var g = clamp(grow * 1.6 - d / 30 * 0.6), ang = -Math.PI / 2 + d / 30 * Math.PI * 2, cx = Math.cos(ang), cy = Math.sin(ang);
        var day = days[d] || [0, 0], seeds = [];
        if (day[0]) seeds.push({ len: Math.min(104, 70 + 16 * day[0]), size: Math.min(24, 6 + 5 * day[0]), c: d % 2 ? C.t700 : C.t500 });
        if (day[1]) seeds.push({ len: Math.min(104, 70 + 16 * day[1]) + (day[0] ? 14 : 0), size: Math.min(24, 6 + 5 * day[1]), c: d % 2 ? C.s700 : C.s500 });
        if (!seeds.length) seeds.push({ len: 82, size: 3, c: '#D6CFC7' });
        var far = seeds[seeds.length - 1], L = 18 + (far.len - 18) * g;
        clock.appendChild(el('line', { x1: 120 + cx * 18, y1: 120 + cy * 18, x2: 120 + cx * (L - far.size / 2), y2: 120 + cy * (L - far.size / 2), stroke: '#D6CFC7', 'stroke-width': 1 }));
        seeds.forEach(function (s) {
          var sl = 18 + (s.len - 18) * g;
          clock.appendChild(el('circle', { cx: 120 + cx * sl, cy: 120 + cy * sl, r: s.size / 2 * back(clamp((grow * 1.6 - d / 30 * 0.6 - 0.15) / 0.85)), fill: s.c }));
        });
      }
      clock.appendChild(el('circle', { cx: 120, cy: 120, r: 14, fill: C.p900 }));
    }
    function grow(days) {
      if (still) { drawClock(days, 1); return; }
      var t0 = performance.now();
      (function f(now) { var p = clamp((now - t0) / 1100); drawClock(days, ease(p)); if (p < 1) requestAnimationFrame(f); })(t0);
    }
    drawClock([], 1);
    var newLog = tr.querySelector('.try__log--new');
    tr.querySelectorAll('.try__chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        tr.querySelectorAll('.try__chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        var feel = chip.dataset.feel, good = !chip.classList.contains('is-bad');
        // 2 · the log appears on top of the list
        newLog.querySelector('.try__what b').textContent = feel;
        var ic = newLog.querySelector('.try__ic'); ic.className = 'try__ic ' + (good ? 'is-good' : 'is-bad'); ic.innerHTML = chip.querySelector('svg').outerHTML;
        tr.classList.remove('is-logged'); void tr.offsetWidth; tr.classList.add('is-logged'); tr.classList.toggle('is-bad', !good);
        // 3 · the month for this app, and what Awa makes of it
        var ins = INSIGHT[feel], days = [], nGood = 0, nBad = 0;
        ins.days.forEach(function (r) { days[r[0]] = [r[1], r[2]]; nGood += r[1]; nBad += r[2]; });
        grow(days);
        cap.textContent = 'Last month · ' + (nGood ? nGood + ' good' : '') + (nGood && nBad ? ' · ' : '') + (nBad ? nBad + ' not so good' : '');
        title.textContent = ins.title;
        body.textContent = ins.body;
      });
    });
  }

  /* ---------------------------------------------------------- the rest */
  new Meadow(document.querySelector('.final .field-canvas'), { seed: 21, tone: 'navy', windOn: document.querySelector('.final') });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.6 });
  document.querySelectorAll('.sprout').forEach(function (el) { io.observe(el); });
})();
