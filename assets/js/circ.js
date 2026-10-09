// Model sirkulasi: anggota, peminjaman, reservasi, denda (mock data + localStorage).
// Dimuat setelah data.js.
const DAY = 86400000;
const pad = (n) => String(n).padStart(2, '0');
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toDate = (iso) => new Date(`${iso}T00:00:00`);
const todayISO = () => isoOf(new Date());
const addDays = (iso, n) => { const d = toDate(iso); d.setDate(d.getDate() + n); return isoOf(d); };
const diffDays = (a, b) => Math.round((toDate(a) - toDate(b)) / DAY);
const fmtDate = (iso) => iso ? toDate(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-';
const rupiah = (n) => `Rp ${Math.round(n).toLocaleString('en-US')}`;
const $ = (id) => document.getElementById(id);

// Pengaturan (nilai bawaan sama dengan halaman Settings)
const DEFAULT_SETTINGS = { loanDays: 7, maxLoans: 3, maxExtensions: 1, extensionDays: 7, finePerDay: 1000, damagedPct: 50, lostPct: 100, holdDays: 3 };
function getSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('elib_settings') || '{}') }; }
  catch (e) { return { ...DEFAULT_SETTINGS }; }
}

// ---------- Data bawaan ----------
const MEMBER_NAMES = [...new Set(LOAN_REPORT.map((r) => r.member))];
const DEFAULT_MEMBERS = MEMBER_NAMES.map((name, i) => ({
  id: i + 1, name, email: `${name.toLowerCase().replace(/ /g, '.')}@mail.example`,
  phone: `+62 812 5550 ${1000 + i}`, address: `Jl. Merdeka No. ${i + 1}, Jakarta`,
  status: name === 'Gilang Ramadhan' ? 'Inactive' : name === 'Joko Susilo' ? 'Suspended' : 'Active',
  joined: i >= 14 ? `2026-10-0${i - 12}` : `2026-0${1 + (i % 8)}-${10 + i}`, note: ''
}));

const DEFAULT_LOANS = LOAN_REPORT.map((r, i) => ({
  id: i + 1, memberId: MEMBER_NAMES.indexOf(r.member) + 1,
  bookId: DEFAULT_BOOKS.find((b) => b.title === r.book).id,
  loanDate: r.loanDate, dueDate: addDays(r.loanDate, 7), returnDate: r.returnDate,
  condition: r.returnDate ? 'Good' : '', note: '', extensions: 0
}));

const DEFAULT_FINES = DEFAULT_LOANS
  .filter((l) => l.returnDate && diffDays(l.returnDate, l.dueDate) > 0)
  .map((l, i) => {
    const days = diffDays(l.returnDate, l.dueDate);
    const status = i < 2 ? 'Paid' : i === 2 ? 'Waived' : 'Unpaid';
    return {
      id: i + 1, loanId: l.id, memberId: l.memberId, bookId: l.bookId, type: 'Late', days, amount: days * 1000, status,
      method: status === 'Paid' ? ['Cash', 'QRIS'][i] : '', paidOn: status === 'Paid' ? `2026-10-0${i + 3}` : '',
      note: status === 'Waived' ? 'First offence' : ''
    };
  });

const DEFAULT_RESERVATIONS = [
  [1, 11, '2026-10-01', 'Waiting'], [2, 3, '2026-10-02', 'Ready'], [3, 11, '2026-10-03', 'Waiting'],
  [4, 8, '2026-09-20', 'Expired'], [5, 16, '2026-10-04', 'Cancelled'], [6, 7, '2026-10-05', 'Ready'], [7, 11, '2026-10-06', 'Waiting']
].map((r, i) => ({ id: i + 1, memberId: r[0], bookId: r[1], reservedOn: r[2], status: r[3] }));

const getMembers = () => loadList('elib_members', DEFAULT_MEMBERS);
const saveMembers = (l) => localStorage.setItem('elib_members', JSON.stringify(l));
const getLoans = () => loadList('elib_loans', DEFAULT_LOANS);
const saveLoans = (l) => localStorage.setItem('elib_loans', JSON.stringify(l));
const getFines = () => loadList('elib_fines', DEFAULT_FINES);
const saveFines = (l) => localStorage.setItem('elib_fines', JSON.stringify(l));
const getReservations = () => loadList('elib_reservations', DEFAULT_RESERVATIONS);
const saveReservations = (l) => localStorage.setItem('elib_reservations', JSON.stringify(l));

// Data aktif (halaman boleh mengisi ulang variabel ini setelah mengubah data)
let members = getMembers();
let books = getBooks();
let loans = getLoans();
let fines = getFines();
let reservations = getReservations();

// ---------- Fungsi bantu ----------
const nextId = (list) => Math.max(0, ...list.map((x) => x.id)) + 1;
const memberName = (id) => (members.find((m) => m.id === id) || { name: 'Unknown' }).name;
const bookTitle = (id) => (books.find((b) => b.id === id) || { title: 'Deleted book' }).title;
const memberNo = (m) => `MBR-${String(m.id).padStart(4, '0')}`;
const loanCode = (l) => `LN-${String(l.id).padStart(4, '0')}`;
const initialsOf = (name) => name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const chip = (label) => `<span class="chip chip-${label.toLowerCase().replace(/ /g, '')}">${esc(label)}</span>`;
const person = (name, sub) => `<span class="name-cell"><span class="avatar">${esc(initialsOf(name))}</span><span><strong>${esc(name)}</strong>${sub ? `<div class="mini-label">${esc(sub)}</div>` : ''}</span></span>`;

function loanStatus(l) {
  if (l.returnDate) return 'Returned';
  const left = diffDays(l.dueDate, todayISO());
  return left < 0 ? 'Overdue' : left <= 3 ? 'Due Soon' : 'Borrowed';
}
const lateDays = (l, onDate) => Math.max(0, diffDays(l.returnDate || onDate || todayISO(), l.dueDate));
function countdown(l) {
  if (l.returnDate) return '';
  const left = diffDays(l.dueDate, todayISO());
  if (left < 0) return `<span class="chip chip-overdue">${-left} day${left === -1 ? '' : 's'} late</span>`;
  return `<span class="chip chip-${left <= 3 ? 'duesoon' : 'borrowed'}">${left === 0 ? 'Due today' : `${left} day${left === 1 ? '' : 's'} left`}</span>`;
}
const activeLoansOf = (memberId) => loans.filter((l) => l.memberId === memberId && !l.returnDate);
const unpaidOf = (memberId) => fines.filter((f) => f.memberId === memberId && f.status === 'Unpaid').reduce((s, f) => s + f.amount, 0);

// Pagination
const PER_PAGE = 8;
function paginate(list, page) {
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const p = Math.min(page, pages);
  const start = (p - 1) * PER_PAGE;
  return { page: p, pages, start, rows: list.slice(start, start + PER_PAGE) };
}
function renderFoot(pg, total) {
  $('pageInfo').textContent = total ? `Showing ${pg.start + 1}-${pg.start + pg.rows.length} of ${total} entries` : 'Showing 0 entries';
  $('pager').innerHTML =
    `<button class="page-btn" data-page="${pg.page - 1}" ${pg.page === 1 ? 'disabled' : ''} aria-label="Previous page">&lsaquo;</button>` +
    Array.from({ length: pg.pages }, (_, i) => `<button class="page-btn" data-page="${i + 1}" ${i + 1 === pg.page ? 'aria-current="page"' : ''}>${i + 1}</button>`).join('') +
    `<button class="page-btn" data-page="${pg.page + 1}" ${pg.page === pg.pages ? 'disabled' : ''} aria-label="Next page">&rsaquo;</button>`;
}
function bindPager(onChange) {
  $('pager').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page]');
    if (btn && !btn.disabled) onChange(Number(btn.dataset.page));
  });
}

// Tab status dengan jumlah data
function renderTabs(names, active, countOf) {
  $('tabs').innerHTML = names.map((n) =>
    `<button class="tab" role="tab" data-tab="${n}" aria-selected="${n === active}">${n}<span>${countOf(n)}</span></button>`).join('');
}
function bindTabs(onChange) {
  $('tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (btn) onChange(btn.dataset.tab);
  });
}

// Error field (konvensi id: field_x, f_x, err_x)
function fieldError(name, message) {
  $(`field_${name}`).classList.toggle('invalid', Boolean(message));
  $(`err_${name}`).textContent = message;
  $(`f_${name}`).setAttribute('aria-invalid', Boolean(message));
  return !message;
}
const optionList = (items, label) => `<option value="">Select...</option>` + items.map((x) => `<option value="${x.id}">${esc(label(x))}</option>`).join('');

// Tombol [data-close] menutup dialog terdekat
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-close]');
  if (btn) btn.closest('dialog').close();
});