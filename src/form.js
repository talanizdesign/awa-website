/* Waiting list form (hero and end of page).
   Not connected yet: step 2 sends the address to the Supabase function. For now it only checks the email
   and shows "Check your inbox". */
document.querySelectorAll('.join').forEach(function (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var input = form.querySelector('input');
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    form.classList.toggle('is-err', !ok);
    input.setAttribute('aria-invalid', String(!ok));
    if (ok) { form.classList.add('is-sent'); form.querySelector('.join__ok').focus(); }
  });
});
