/* /confirm/?t=… : confirms the waiting list address through the "waitlist" function. */
(function () {
  var URL_ = 'https://aqodeoaxcuhivxesfxbb.supabase.co/functions/v1/waitlist';
  var box = document.querySelector('.solo__msg');
  var token = new URLSearchParams(location.search).get('t') || '';
  function show(state) {
    box.setAttribute('data-state', state);
    var h = box.querySelector('[data-for="' + state + '"] h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
  }
  // Keep the token out of the address bar and the browser history.
  if (history.replaceState) history.replaceState(null, '', location.pathname);
  if (!/^[0-9a-f]{64}$/.test(token)) return show('link');
  fetch(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'confirm', token: token })
  }).then(function (res) {
    show(res.ok ? 'ok' : res.status === 404 ? 'link' : 'net');
  }).catch(function () { show('net'); });
})();
