const PROFILE_DEFAULT = { name: 'Amelia Hart', email: 'admin@elibrary.test', phone: '+62 812 0000 1234' };
const NOTIF_DEFAULT = { notifDue: true, notifDueDays: '2', notifOverdue: true, notifReady: true, notifLowStock: true, notifDaily: false };
const DEMO_PASSWORD = 'admin123';

// ---------- Konfigurasi form ----------
const PROFILE_FIELDS = [
  { key: 'name', label: 'Full Name', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone Number', type: 'tel' }
];
const RULE_GROUPS = [
  { title: 'Loan Policy', fields: [
    { key: 'loanDays', label: 'Default Loan Duration (days)', help: 'Pre-fills the due date on the Loans page', min: 1, max: 365 },
    { key: 'maxLoans', label: 'Maximum Active Loans per Member', help: 'Members at this limit cannot borrow more books', min: 1, max: 20 },
    { key: 'maxExtensions', label: 'Maximum Extensions per Loan', help: 'Used by the Extend action on the Loans page', min: 0, max: 10 },
    { key: 'extensionDays', label: 'Extension Length (days)', help: 'Days added to the due date when extending', min: 1, max: 90 }
  ] },
  { title: 'Fines', fields: [
    { key: 'finePerDay', label: 'Late Fine per Day (Rp)', help: 'Used to calculate fines on the Returns page', min: 1, max: 1000000 },
    { key: 'damagedPct', label: 'Damaged Book Fee (% of book price)', help: 'Used when a book is returned as Damaged', min: 1, max: 100 },
    { key: 'lostPct', label: 'Lost Book Fee (% of book price)', help: 'Used when a book is returned as Lost', min: 1, max: 100 }
  ] },
  { title: 'Reservations & Stock', fields: [
    { key: 'holdDays', label: 'Reservation Hold Period (days)', help: 'Pickup window for ready reservations', min: 1, max: 30 },
    { key: 'lowStock', label: 'Low Stock Threshold (copies)', help: 'Books at or below this stock show Low Stock on the Books page', min: 1, max: 100 }
  ] }
];
const NOTIFS = [
  { group: 'Circulation', items: [
    { key: 'notifDue', title: 'Due Date Reminder', desc: 'Remind members before a loan is due', select: 'notifDueDays' },
    { key: 'notifOverdue', title: 'Overdue Alerts', desc: 'Alert staff when a loan passes its due date' },
    { key: 'notifReady', title: 'Reservation Ready', desc: 'Notify members when a reserved book is available' }
  ] },
  { group: 'Catalog', items: [
    { key: 'notifLowStock', title: 'Low Stock Alerts', desc: 'Alert staff when a book reaches the low stock threshold' },
    { key: 'notifDaily', title: 'Daily Summary Email', desc: 'Send a summary of daily library activity' }
  ] }
];
const RANGES = {};
RULE_GROUPS.forEach((g) => g.fields.forEach((f) => { RANGES[f.key] = [f.min, f.max]; }));

const FORMS = {
  profile: { store: 'elib_profile', defaults: PROFILE_DEFAULT, keys: PROFILE_FIELDS.map((f) => f.key) },
  rules: { store: 'elib_settings', defaults: DEFAULT_SETTINGS, keys: Object.keys(RANGES) },
  notif: { store: 'elib_settings', defaults: NOTIF_DEFAULT, keys: Object.keys(NOTIF_DEFAULT) }
};
const snapshot = {};

// ---------- Tampilan form ----------
const numberField = (f) => `<div class="field" id="fs_${f.key}"><label for="s_${f.key}">${f.label}</label>
  <input type="number" id="s_${f.key}" data-key="${f.key}" aria-describedby="hs_${f.key} es_${f.key}">
  <p class="help" id="hs_${f.key}">${f.help}</p><p class="error" id="es_${f.key}"></p></div>`;

$('body-profile').innerHTML = `<div class="form-grid">${PROFILE_FIELDS.map((f) => `<div class="field" id="fs_${f.key}"><label for="s_${f.key}">${f.label}</label>
  <input type="${f.type}" id="s_${f.key}" data-key="${f.key}" aria-describedby="es_${f.key}"><p class="error" id="es_${f.key}"></p></div>`).join('')}
  <div class="field"><label for="s_role">Role</label><input id="s_role" value="Super Admin" disabled><span class="material-symbols-outlined lock" aria-hidden="true">lock</span></div>
  <div class="field"><label for="s_joined">Joined Date</label><input id="s_joined" value="Jan 15, 2026" disabled><span class="material-symbols-outlined lock" aria-hidden="true">lock</span></div></div>`;

$('body-rules').innerHTML = RULE_GROUPS.map((g) => `<h3 class="group-title">${g.title}</h3><div class="form-grid">${g.fields.map(numberField).join('')}</div>`).join('');

$('body-notif').innerHTML = NOTIFS.map((g) => `<h3 class="group-title">${g.group}</h3>` + g.items.map((n) => `
  <div class="switch-row"><label for="s_${n.key}"><strong>${n.title}</strong><small>${n.desc}</small></label>
  <span class="switch-ctl">${n.select ? `<select id="s_${n.select}" data-key="${n.select}" aria-label="Days before due date">
    ${[1, 2, 3, 5, 7].map((d) => `<option value="${d}">${d} day${d > 1 ? 's' : ''} before</option>`).join('')}</select>` : ''}
  <input type="checkbox" class="switch" role="switch" id="s_${n.key}" data-key="${n.key}"></span></div>`).join('')).join('');

// ---------- Baca dan tulis nilai ----------
const readStore = (name) => { try { return JSON.parse(localStorage.getItem(FORMS[name].store)) || {}; } catch (e) { return {}; } };
const loadValues = (name) => {
  const saved = readStore(name);
  return Object.fromEntries(FORMS[name].keys.map((k) => [k, saved[k] ?? FORMS[name].defaults[k]]));
};
const control = (k) => $(`s_${k}`);
function writeForm(name, values) {
  FORMS[name].keys.forEach((k) => {
    const el = control(k);
    if (el.type === 'checkbox') el.checked = Boolean(values[k]);
    else el.value = values[k];
  });
  syncToggles();
}
function readForm(name) {
  return Object.fromEntries(FORMS[name].keys.map((k) => {
    const el = control(k);
    return [k, el.type === 'checkbox' ? el.checked : el.type === 'number' ? (el.value === '' ? '' : Number(el.value)) : el.value.trim()];
  }));
}
const syncToggles = () => { $('s_notifDueDays').disabled = !$('s_notifDue').checked; };

// ---------- Validasi ----------
const validators = {
  name: (v) => v ? '' : 'Full name is required',
  email: (v) => !v ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email address' : '',
  phone: (v) => v && !/^[+\d][\d\s-]{6,}$/.test(v) ? 'Enter a valid phone number' : ''
};
function check(key, value) {
  if (validators[key]) return validators[key](value);
  const [min, max] = RANGES[key] || [];
  if (min === undefined) return '';
  if (value === '' || !Number.isInteger(value)) return 'Enter a whole number';
  if (value < min) return min === 1 ? 'Value must be greater than 0' : `Value must be at least ${min}`;
  return value > max ? `Value must be at most ${max.toLocaleString('en-US')}` : '';
}
function showError(key, message) {
  const field = $(`fs_${key}`);
  if (!field) return true;
  field.classList.toggle('invalid', Boolean(message));
  $(`es_${key}`).textContent = message;
  control(key).setAttribute('aria-invalid', Boolean(message));
  return !message;
}

// ---------- Status perubahan (dirty) ----------
function updateDirty(name) {
  const dirty = JSON.stringify(readForm(name)) !== snapshot[name];
  $(`save-${name}`).disabled = !dirty;
  $(`dirty-${name}`).hidden = !dirty;
}

Object.keys(FORMS).forEach((name) => {
  snapshot[name] = JSON.stringify(loadValues(name));
  writeForm(name, loadValues(name));
  const form = $(`form-${name}`);
  form.addEventListener('input', (e) => {
    if (e.target.dataset.key && $(`fs_${e.target.dataset.key}`)?.classList.contains('invalid')) {
      showError(e.target.dataset.key, check(e.target.dataset.key, readForm(name)[e.target.dataset.key]));
    }
    syncToggles();
    updateDirty(name);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const values = readForm(name);
    const bad = FORMS[name].keys.filter((k) => !showError(k, check(k, values[k])));
    if (bad.length) { control(bad[0]).focus(); return; }
    localStorage.setItem(FORMS[name].store, JSON.stringify({ ...readStore(name), ...values }));
    snapshot[name] = JSON.stringify(values);
    updateDirty(name);
    showToast('Settings saved successfully');
  });
  document.querySelector(`[data-reset="${name}"]`).addEventListener('click', () => {
    writeForm(name, JSON.parse(snapshot[name]));
    FORMS[name].keys.forEach((k) => showError(k, ''));
    updateDirty(name);
  });
});

// ---------- Tab ----------
document.querySelectorAll('[data-tab]').forEach((btn) => btn.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', b === btn));
  document.querySelectorAll('.tabpanel').forEach((p) => { p.hidden = p.id !== `panel-${btn.dataset.tab}`; });
}));

// ---------- Foto profil (hanya pratinjau) ----------
$('photoBtn').addEventListener('click', () => $('photoInput').click());
$('photoInput').addEventListener('change', () => {
  const file = $('photoInput').files[0];
  if (!file || !file.type.startsWith('image/')) return;
  $('bigAvatar').style.backgroundImage = `url(${URL.createObjectURL(file)})`;
  $('bigAvatar').textContent = '';
});
(function setAvatar() {
  $('bigAvatar').textContent = loadValues('profile').name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
})();

// ---------- Keamanan: ganti password ----------
const storedPassword = () => localStorage.getItem('elib_password') || DEMO_PASSWORD;
document.querySelectorAll('[data-eye]').forEach((btn) => btn.addEventListener('click', () => {
  const input = $(btn.dataset.eye);
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  btn.firstElementChild.textContent = show ? 'visibility_off' : 'visibility';
}));

function strength(p) {
  const score = [p.length >= 8, /[a-z]/.test(p) && /[A-Z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
  return p ? (score <= 2 ? ['Weak', 'weak'] : score === 3 ? ['Medium', 'medium'] : ['Strong', 'strong']) : ['', ''];
}
$('s_newPass').addEventListener('input', () => {
  const [label, cls] = strength($('s_newPass').value);
  $('strengthBar').className = `strength-fill ${cls}`;
  $('strengthText').textContent = label ? `Password strength: ${label}` : '';
});

const pwError = (name, message) => {
  $(`fs_${name}`).classList.toggle('invalid', Boolean(message));
  $(`es_${name}`).textContent = message;
  return !message;
};
$('form-password').addEventListener('submit', (e) => {
  e.preventDefault();
  const cur = $('s_curPass').value;
  const next = $('s_newPass').value;
  const conf = $('s_confPass').value;
  const results = [
    pwError('curPass', !cur ? 'Current password is required' : cur !== storedPassword() ? 'Current password is incorrect' : ''),
    pwError('newPass', !next ? 'New password is required' : next.length < 8 ? 'Use at least 8 characters'
      : !/[A-Za-z]/.test(next) || !/\d/.test(next) ? 'Include at least one letter and one number'
      : next === cur ? 'New password must be different from the current one' : ''),
    pwError('confPass', conf !== next ? 'Passwords do not match' : '')
  ];
  if (results.includes(false)) return;
  localStorage.setItem('elib_password', next);
  $('form-password').reset();
  $('strengthBar').className = 'strength-fill';
  $('strengthText').textContent = '';
  showToast('Password updated successfully');
});

// ---------- Keamanan: sesi aktif ----------
let sessions = [
  { id: 1, device: 'Chrome on Windows', place: 'Jakarta, ID', last: 'Active now', current: true },
  { id: 2, device: 'Safari on iPhone', place: 'Bandung, ID', last: '2 days ago', current: false }
];
function renderSessions() {
  $('sessionBody').innerHTML = sessions.map((s) => `<tr>
    <td>${esc(s.device)} ${s.current ? '<span class="chip chip-good">This device</span>' : ''}</td>
    <td>${esc(s.place)}</td><td>${esc(s.last)}</td>
    <td class="row-actions">${s.current ? '' : `<button class="btn-text" data-signout="${s.id}">Sign out</button>`}</td></tr>`).join('');
}
$('sessionBody').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-signout]');
  if (!btn) return;
  sessions = sessions.filter((s) => s.id !== Number(btn.dataset.signout));
  renderSessions();
  showToast('Device signed out');
});
$('signoutAll').addEventListener('click', () => $('signoutDialog').showModal());
$('confirmSignout').addEventListener('click', () => {
  sessionStorage.removeItem('elib_auth');
  location.href = '../index.html';
});
renderSessions();