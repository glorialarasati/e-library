// Akun demo (tanpa back-end). Hanya untuk simulasi login di sisi klien.
const DEMO_USER = { email: 'admin@elibrary.test', password: 'admin123' };
const AUTH_KEY = 'elib_auth';
const EMAIL_KEY = 'elib_email';

const $ = (id) => document.getElementById(id);

// Jika sudah login, langsung ke dashboard
if (sessionStorage.getItem(AUTH_KEY)) location.replace('pages/dashboard.html');

// Isi email jika pernah memilih "Remember me"
const savedEmail = localStorage.getItem(EMAIL_KEY);
if (savedEmail) {
  $('email').value = savedEmail;
  $('remember').checked = true;
}

function notify(message) {
  const bar = $('snackbar');
  bar.textContent = message;
  bar.classList.add('show');
  clearTimeout(bar.timer);
  bar.timer = setTimeout(() => bar.classList.remove('show'), 3000);
}

function setError(name, message) {
  $(`field-${name}`).classList.toggle('invalid', Boolean(message));
  $(`err-${name}`).textContent = message;
  $(name).setAttribute('aria-invalid', Boolean(message));
}

const rules = {
  email: (v) => !v.trim() ? 'Email address is required'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? 'Enter a valid email address' : '',
  password: (v) => !v ? 'Password is required' : ''
};
function validate(name) {
  const message = rules[name]($(name).value);
  setError(name, message);
  return !message;
}

['email', 'password'].forEach((name) => {
  $(name).addEventListener('blur', () => validate(name));
  $(name).addEventListener('input', () => {
    $('loginAlert').hidden = true;
    if ($(`field-${name}`).classList.contains('invalid')) validate(name);
  });
});

// Tampilkan / sembunyikan password
$('togglePass').addEventListener('click', () => {
  const show = $('password').type === 'password';
  $('password').type = show ? 'text' : 'password';
  $('togglePass').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  $('togglePass').firstElementChild.textContent = show ? 'visibility_off' : 'visibility';
});

$('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const okEmail = validate('email');
  const okPass = validate('password');
  if (!okEmail || !okPass) {
    (okEmail ? $('password') : $('email')).focus();
    return;
  }

  const btn = $('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Signing in...';

  // Jeda singkat agar terasa seperti proses autentikasi
  setTimeout(() => {
    const valid = $('email').value.trim().toLowerCase() === DEMO_USER.email && $('password').value === DEMO_USER.password;
    if (valid) {
      sessionStorage.setItem(AUTH_KEY, '1');
      if ($('remember').checked) localStorage.setItem(EMAIL_KEY, DEMO_USER.email);
      else localStorage.removeItem(EMAIL_KEY);
      location.href = 'pages/dashboard.html';
      return;
    }
    $('loginAlert').textContent = 'Incorrect email or password. Please check your details and try again.';
    $('loginAlert').hidden = false;
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">lock</span>Login';
    $('password').value = '';
    $('password').focus();
  }, 600);
});

$('forgotLink').addEventListener('click', (e) => { e.preventDefault(); notify('Password reset is not available in this demo'); });
$('supportLink').addEventListener('click', (e) => { e.preventDefault(); notify('Contact: admin@elibrary.test'); });