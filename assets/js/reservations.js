const TABS = ['All', 'Waiting', 'Ready', 'Expired', 'Cancelled'];
let page = 1;
let tab = 'All';
let target = null;

const isOpen = (r) => r.status === 'Waiting' || r.status === 'Ready';
const matchTab = (r, t) => t === 'All' || r.status === t;

// Urutan antrean: reservasi lebih lama untuk buku yang sama lebih dulu
const queueOf = (r) => 1 + reservations.filter((x) => x.bookId === r.bookId && isOpen(x) && x.id < r.id).length;

function render() {
  const q = $('search').value.trim().toLowerCase();
  const list = reservations.filter((r) => matchTab(r, tab) &&
    (!q || [memberName(r.memberId), bookTitle(r.bookId)].some((v) => v.toLowerCase().includes(q))))
    .sort((a, b) => b.id - a.id);
  const pg = paginate(list, page);
  page = pg.page;

  const count = (s) => reservations.filter((r) => r.status === s).length;
  $('sWaiting').textContent = count('Waiting');
  $('sReady').textContent = count('Ready');
  $('sExpired').textContent = count('Expired');
  renderTabs(TABS, tab, (t) => reservations.filter((r) => matchTab(r, t)).length);

  $('body').innerHTML = pg.rows.length ? pg.rows.map((r, i) => `
    <tr>
      <td>${pg.start + i + 1}</td>
      <td>${person(memberName(r.memberId))}</td>
      <td>${esc(bookTitle(r.bookId))}</td>
      <td>${fmtDate(r.reservedOn)}</td>
      <td>${isOpen(r) ? `<span class="chip chip-cat">#${queueOf(r)}</span>` : '-'}</td>
      <td>${chip(r.status)}</td>
      <td class="row-actions">
        <button class="icon-btn" data-notify="${r.id}" ${isOpen(r) ? '' : 'disabled'} aria-label="Notify ${esc(memberName(r.memberId))}"><span class="material-symbols-outlined" aria-hidden="true">notifications_active</span></button>
        <button class="icon-btn" data-convert="${r.id}" ${r.status === 'Ready' ? '' : 'disabled'} aria-label="Convert to loan"><span class="material-symbols-outlined" aria-hidden="true">assignment_turned_in</span></button>
        <button class="icon-btn danger" data-cancel="${r.id}" ${isOpen(r) ? '' : 'disabled'} aria-label="Cancel reservation"><span class="material-symbols-outlined" aria-hidden="true">cancel</span></button>
      </td></tr>`).join('') : '<tr><td colspan="7" class="empty">No reservations found.</td></tr>';
  renderFoot(pg, list.length);
}

$('search').addEventListener('input', () => { page = 1; render(); });
bindPager((p) => { page = p; render(); });
bindTabs((t) => { tab = t; page = 1; render(); });

// ---------- Reservasi baru ----------
$('addBtn').addEventListener('click', () => {
  $('f_member').innerHTML = optionList(members.filter((m) => m.status === 'Active'), (m) => `${m.name} (${memberNo(m)})`);
  $('f_book').innerHTML = optionList(books, (b) => `${b.title} (stock ${b.stock})`);
  ['member', 'book'].forEach((n) => fieldError(n, ''));
  $('newDialog').showModal();
});

const checks = {
  member: (v) => v ? '' : 'Select a member',
  book: (v) => {
    if (!v) return 'Select a book';
    const m = Number($('f_member').value);
    if (!m) return '';
    if (reservations.some((r) => r.memberId === m && r.bookId === Number(v) && isOpen(r))) return 'This member already reserved this book';
    if (activeLoansOf(m).some((l) => l.bookId === Number(v))) return 'This member is already borrowing this book';
    return '';
  }
};
Object.keys(checks).forEach((n) => $(`f_${n}`).addEventListener('change', () => {
  fieldError(n, checks[n]($(`f_${n}`).value));
  if (n === 'member' && $('f_book').value) fieldError('book', checks.book($('f_book').value));
}));

$('newForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const bad = Object.keys(checks).filter((n) => !fieldError(n, checks[n]($(`f_${n}`).value)));
  if (bad.length) { $(`f_${bad[0]}`).focus(); return; }
  const book = books.find((b) => b.id === Number($('f_book').value));
  const ready = book.stock > 0; // buku tersedia: langsung siap diambil
  reservations.push({
    id: nextId(reservations), memberId: Number($('f_member').value), bookId: book.id,
    reservedOn: todayISO(), status: ready ? 'Ready' : 'Waiting'
  });
  saveReservations(reservations);
  $('newDialog').close();
  render();
  showToast(ready ? 'Book is in stock, reservation is ready for pickup' : 'Reservation added to the queue');
});

// ---------- Aksi di tabel ----------
const byId = (btn, attr) => reservations.find((r) => r.id === Number(btn.dataset[attr]));
$('body').addEventListener('click', (e) => {
  const notify = e.target.closest('[data-notify]');
  const conv = e.target.closest('[data-convert]');
  const canc = e.target.closest('[data-cancel]');
  if (notify) showToast(`Notification sent to ${memberName(byId(notify, 'notify').memberId)}`);
  if (conv) {
    target = byId(conv, 'convert');
    const m = members.find((x) => x.id === target.memberId);
    const book = books.find((b) => b.id === target.bookId);
    const s = getSettings();
    const problem = !m || m.status !== 'Active' ? 'This member is not active, so a loan cannot be created.'
      : !book || book.stock < 1 ? 'The book is out of stock right now.'
      : activeLoansOf(m.id).length >= s.maxLoans ? `This member already has ${s.maxLoans} active loans.` : '';
    $('convertText').textContent = `${memberName(target.memberId)} will borrow "${bookTitle(target.bookId)}" for ${s.loanDays} days.`;
    $('convertError').hidden = !problem;
    $('convertError').textContent = problem;
    $('confirmConvert').disabled = Boolean(problem);
    $('convertDialog').showModal();
  }
  if (canc) {
    target = byId(canc, 'cancel');
    $('cancelText').textContent = `The reservation of "${bookTitle(target.bookId)}" for ${memberName(target.memberId)} will be cancelled.`;
    $('cancelDialog').showModal();
  }
});

$('confirmConvert').addEventListener('click', () => {
  const book = books.find((b) => b.id === target.bookId);
  const loan = {
    id: nextId(loans), memberId: target.memberId, bookId: target.bookId, loanDate: todayISO(),
    dueDate: addDays(todayISO(), getSettings().loanDays), returnDate: '', condition: '', note: '', extensions: 0
  };
  loans.push(loan);
  book.stock -= 1;
  target.status = 'Converted';
  saveLoans(loans);
  saveBooks(books);
  saveReservations(reservations);
  $('convertDialog').close();
  render();
  showToast(`Reservation converted to loan ${loanCode(loan)}`);
});

$('confirmCancel').addEventListener('click', () => {
  target.status = 'Cancelled';
  saveReservations(reservations);
  $('cancelDialog').close();
  render();
  showToast('Reservation cancelled');
});

render();