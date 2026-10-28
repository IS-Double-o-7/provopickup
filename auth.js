/* =====================================================================
   Rally Provo — sign-in gate
   Every visitor sees the login screen until Supabase Auth has a saved
   session for them. supabase-js keeps that session in this browser, so
   a returning player goes straight into the app.

   This file owns the shared Supabase client (window.rallyDb) so the app
   and the login screen use one session. app.js waits for
   RallyAuth.whenSignedIn() before it boots.
   ===================================================================== */
(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const db = window.supabase.createClient(RALLY_CONFIG.SUPABASE_URL, RALLY_CONFIG.SUPABASE_ANON_KEY);
window.rallyDb = db;

const gate = $('#auth'), app = $('#app');
const form = $('#authForm'), msg = $('#authMsg'), submit = $('#authSubmit');
const email = $('#authEmail'), pass = $('#authPassword'), confirmField = $('#authConfirmField'), confirm = $('#authConfirm');

let mode = 'login';
let user = null;
const waiting = [];

/* ---- showing the gate or the app ---- */
function showApp(u) {
  user = u;
  gate.hidden = true;
  app.hidden = false;
  document.title = 'Rally Provo';
  while (waiting.length) waiting.shift()(u);
}
function showGate() {
  user = null;
  app.hidden = true;
  gate.hidden = false;
  document.title = (mode === 'login' ? 'Log in' : 'Sign up') + ' · Rally Provo';
}

/* ---- log in / sign up toggle ---- */
const COPY = {
  login:  { title: 'Welcome back', sub: 'Log in to find your next game.', btn: 'Log in', pw: 'current-password' },
  signup: { title: 'Create your account', sub: 'Sign up with your email. It takes a minute.', btn: 'Create account', pw: 'new-password' },
};
function setMode(m) {
  mode = m;
  const c = COPY[m];
  $('#authTitle').textContent = c.title;
  $('#authSub').textContent = c.sub;
  submit.textContent = c.btn;
  pass.autocomplete = c.pw;
  confirmField.hidden = m !== 'signup';
  confirm.required = m === 'signup';
  $('#authPwHint').hidden = m !== 'signup';
  document.querySelectorAll('[data-auth-mode]').forEach(b => {
    const on = b.dataset.authMode === m;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on);
    b.tabIndex = on ? 0 : -1;
  });
  say('');
  if (!gate.hidden) document.title = (m === 'login' ? 'Log in' : 'Sign up') + ' · Rally Provo';
}
function say(text, kind = 'error') {
  msg.textContent = text;
  msg.dataset.kind = kind;
  msg.hidden = !text;
}
function busy(on) {
  submit.disabled = on;
  submit.setAttribute('aria-busy', on);
  if (on) submit.textContent = mode === 'login' ? 'Logging in…' : 'Creating account…';
  else submit.textContent = COPY[mode].btn;
}

/* Supabase error text is written for developers; translate the common ones. */
function friendly(err) {
  const m = (err && err.message || '').toLowerCase();
  if (m.includes('invalid login')) return 'That email and password don’t match an account.';
  if (m.includes('email not confirmed')) return 'Confirm your email first — check your inbox for the link we sent.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'An account with that email already exists. Log in instead.';
  if (m.includes('password')) return err.message;
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many tries. Wait a minute and try again.';
  if (m.includes('fetch') || m.includes('network')) return 'Could not reach the server. Check your connection and try again.';
  return err && err.message ? err.message : 'Something went wrong. Try again.';
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  say('');
  const em = email.value.trim(), pw = pass.value;
  if (!em || !email.checkValidity()) { say('Enter a valid email address.'); email.focus(); return; }
  if (pw.length < 6) { say('Passwords need at least 6 characters.'); pass.focus(); return; }
  if (mode === 'signup' && pw !== confirm.value) { say('Those passwords don’t match.'); confirm.focus(); return; }

  busy(true);
  try {
    if (mode === 'login') {
      const { error } = await db.auth.signInWithPassword({ email: em, password: pw });
      if (error) throw error;
      // onAuthStateChange shows the app.
    } else {
      const { data, error } = await db.auth.signUp({
        email: em, password: pw,
        options: { emailRedirectTo: location.origin + location.pathname },
      });
      if (error) throw error;
      // Supabase returns a user with no identities when the email is already taken
      // (it hides that on purpose); tell the person to log in instead.
      if (data.user && Array.isArray(data.user.identities) && !data.user.identities.length) {
        throw new Error('already registered');
      }
      if (!data.session) {
        setMode('login');
        email.value = em;
        say(`Almost there. We sent a confirmation link to ${em}. Open it, then log in here.`, 'ok');
      }
      // With email confirmation off, a session comes back and onAuthStateChange shows the app.
    }
  } catch (err) {
    say(friendly(err));
  } finally {
    busy(false);
    pass.value = ''; confirm.value = '';
  }
});

/* Tabs: click, plus arrow keys between the two. */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-auth-mode]');
  if (t) { setMode(t.dataset.authMode); email.focus(); return; }
  const out = e.target.closest('[data-auth="sign-out"]');
  if (out) signOut();
});
$('#authTabs').addEventListener('keydown', e => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  e.preventDefault();
  setMode(mode === 'login' ? 'signup' : 'login');
  $(`[data-auth-mode="${mode}"]`).focus();
});

async function signOut() {
  await db.auth.signOut();
  // Reload so no screen from the previous session stays in memory.
  location.reload();
}

/* ---- public API for app.js ---- */
window.RallyAuth = {
  /** Runs cb(user) once a player is signed in (immediately if they already are). */
  whenSignedIn(cb) { if (user) cb(user); else waiting.push(cb); },
  user: () => user,
  signOut,
};

/* ---- start ---- */
setMode(location.hash === '#signup' ? 'signup' : 'login');
db.auth.onAuthStateChange((event, session) => {
  if (session && session.user) { if (!user) showApp(session.user); }
  else if (event === 'SIGNED_OUT') showGate();
});
db.auth.getSession().then(({ data }) => {
  if (data.session && data.session.user) showApp(data.session.user);
  else { showGate(); $('#authLoading').hidden = true; form.hidden = false; }
}).catch(() => {
  showGate(); $('#authLoading').hidden = true; form.hidden = false;
  say('Could not reach the server. Check your connection and refresh.');
});
})();
