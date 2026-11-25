/* Waiting list form (hero and end of page). Sends the address to the Supabase function "waitlist",
   which emails a confirmation link (double opt-in). See supabase/functions/waitlist/index.ts. */
var WAITLIST_URL = 'https://aqodeoaxcuhivxesfxbb.supabase.co/functions/v1/waitlist';

document.querySelectorAll('.join').forEach(function (form) {
  var input = form.querySelector('input[type=email]');
  var err = form.querySelector('.join__err');
  var btn = form.querySelector('button[type=submit]');
  var label = btn.textContent;

  function fail(msg) {
    err.textContent = msg;
    form.classList.add('is-err');
    input.setAttribute('aria-invalid', 'true');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.classList.contains('is-busy')) return;
    var email = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail('Enter a valid email address.');

    form.classList.remove('is-err');
    input.setAttribute('aria-invalid', 'false');
    form.classList.add('is-busy');
    btn.textContent = 'Sending';

    fetch(WAITLIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', email: email, website: form.querySelector('.join__hp input').value })
    }).then(function (res) {
      if (res.ok) {
        form.classList.add('is-sent');
        form.querySelector('.join__ok').focus();
      } else if (res.status === 400) {
        fail('Enter a valid email address.');
      } else if (res.status === 429) {
        return res.json().then(function (b) {
          fail(b && b.error === 'day' ? 'Lots of people are joining today. Try again tomorrow.'
                                      : 'Lots of people are joining right now. Try again in a few minutes.');
        }, function () { fail('Lots of people are joining right now. Try again in a few minutes.'); });
      } else {
        fail('Something went wrong. Try again in a minute.');
      }
    }).catch(function () {
      fail('Something went wrong. Check your connection and try again.');
    }).then(function () {
      form.classList.remove('is-busy');
      btn.textContent = label;
    });
  });
});
