/* Local test hooks, only in .dev/ (python3 build.py --dev). Never published.
   ?y=N scroll N screens · ?sim=1 drive the hero with a timer (headless Chrome has no animation frames)
   ?g=0..1 force the growth · ?wake=1 turn the hero white · ?pop=1 release seeds · ?open=1 open the hero form · ?try=0..3 pick an emotion */
/* Draft-only test hook: ?y=1.5 scrolls 1.5 screen heights; ?pop=1 releases a few seeds once the meadow has grown. */
(function () {
  var q = new URLSearchParams(location.search);
  if (q.get('y')) setTimeout(function () { window.scrollTo({ top: Number(q.get('y')) * window.innerHeight, behavior: 'instant' }); }, 200);
  if (q.get('try')) setTimeout(function () { document.querySelectorAll('.try__chip')[Number(q.get('try'))].click(); }, 300);
  if (q.get('open')) setTimeout(function () { document.querySelector('.cta__open').click(); }, 100);
  if (q.get('wake')) setTimeout(function () { var g = window.__grow; g.startWake(g.w * 0.3, g.h * 0.85); g.wake = -100000; }, 1200);
  if (q.get('pop')) setTimeout(function () {
    var g = window.__grow, n = 0;
    g.stems.forEach(function (s, i) { if (n < 4 && i % 9 === 4 && s.pos && s.pos[0]) { g.release({ dot: s.dots[0], x: s.pos[0].x, y: s.pos[0].y }); n++; } });
  }, 1500);
})();
/* headless Chrome has no animation frames: ?sim=1 drives the hero with a timer (draft only) */
(function(){ if (!new URLSearchParams(location.search).get('sim')) return; var g = window.__grow, t = 0;
  var force = new URLSearchParams(location.search).get('g'); if (force) g.target = function () { return Number(force); };
  setInterval(function(){ t += 16.67; g.t = t / 1000; g.update(t); g.draw(); }, 16); })();
/* ?og=1: clean hero for the share image (no hint) */
if (new URLSearchParams(location.search).get('og')) { var st = document.createElement('style'); st.textContent = '.hero__hint,.top__link,.cta{display:none}'; document.head.appendChild(st); }
