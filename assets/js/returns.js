let selected = null;

const condition = () => document.querySelector('input[name="cond"]:checked').value;

// ---------- Cari pinjaman ----------
function findLoans(q) {
  const key = q.trim().toLowerCase();
  return loans.filter((l) => !l.returnDate &&
    (loanCode(l).toLowerCase() === key || String(l.id) === key || memberName(l.memberId).toLowerCase().includes(key)));
}

function search(q) {
  $('searchError').textContent = '';
  $('results').innerHTML = '';
  if (!q.trim()) { $('searchError').textContent = 'Enter a Loan ID or member name'; return; }
  const found = findLoans(q);
  if (!found.length) {
    $('searchError').textContent = `No active loan found for "${q.trim()}". Check the Loan ID or member name.`;
    $('detail').hidden = true;
    selected = null;
  } else if (found.length === 1) {
    pick(found[0]);
  } else {
    $('results').innerHTML = `<p class="mini-label">${found.length} active loans found. Choose one:</p>` + found.map((l) =>
      `<button type="button" class="result-btn" data-pick="${l.id}">${loanCode(l)} | ${esc(memberName(l.memberId))} | ${esc(bookTitle(l.bookId))}</button>`).join('');
  }
}

$('searchForm').addEventListener('submit', (e) => { e.preventDefault(); search($('q').value); });
$('results').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-pick]');
  if (btn) pick(loans.find((l) => l.id === Number(btn.dataset.pick)));
});

// ---------- Detail pinjaman ----------
function pick(l) {
  selected = l;
  $('results').innerHTML = '';
  $('searchError').textContent = '';
  $('q').value = loanCode(l);
  $('dLoan').textContent = loanCode(l);
  $('dMember').innerHTML = person(memberName(l.memberId));
  $('dBook').textContent = bookTitle(l.bookId);
  $('dLoanDate').textContent = fmtDate(l.loanDate);
  $('dDue').textContent = fmtDate(l.dueDate);
  const late = lateDays(l);
  $('dLate').innerHTML = late ? `<span class="chip chip-overdue">${late} day${late > 1 ? 's' : ''} late</span>` : '<span class="chip chip-good">On time</span>';

  $('f_retDate').value = todayISO();
  $('f_retDate').max = todayISO();
  $('f_retDate').min = l.loanDate;
  document.querySelector('input[name="cond"][value="Good"]').checked = true;
  $('f_note').value = '';
  ['retDate', 'note'].forEach((n) => fieldError(n, ''));
  refresh();
  $('detail').hidden = false;
  $('detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- Ringkasan denda ----------
function fineLines() {
  const s = getSettings();
  const book = books.find((b) => b.id === selected.bookId);
  const price = book ? book.price : 0;
  const late = Math.max(0, diffDays($('f_retDate').value || todayISO(), selected.dueDate));
  const out = [];
  if (late) out.push({ type: 'Late', days: late, label: `Late fee (${late} day${late > 1 ? 's' : ''} x ${rupiah(s.finePerDay)})`, amount: late * s.finePerDay });
  if (condition() === 'Damaged') out.push({ type: 'Damaged', days: 0, label: `Damage fee (${s.damagedPct}% of ${rupiah(price)})`, amount: Math.round((price * s.damagedPct) / 100) });
  if (condition() === 'Lost') out.push({ type: 'Lost', days: 0, label: `Replacement fee (${s.lostPct}% of ${rupiah(price)})`, amount: Math.round((price * s.lostPct) / 100) });
  return out;
}

function refresh() {
  if (!selected) return;
  const needNote = condition() !== 'Good';
  $('field_note').hidden = !needNote;
  $('lblNote').textContent = needNote ? 'Condition Notes *' : 'Condition Notes';
  const lines = fineLines();
  $('fineList').innerHTML = lines.length
    ? lines.map((x) => `<li><span>${esc(x.label)}</span><strong>${rupiah(x.amount)}</strong></li>`).join('')
    : '<li><span>No fines apply</span><strong>Rp 0</strong></li>';
  $('fineTotal').textContent = rupiah(lines.reduce((s, x) => s + x.amount, 0));
}
document.querySelectorAll('input[name="cond"]').forEach((r) => r.addEventListener('change', () => { fieldError('note', ''); refresh(); }));
$('f_retDate').addEventListener('input', () => { fieldError('retDate', ''); refresh(); });

function reset() {
  selected = null;
  $('detail').hidden = true;
  $('q').value = '';
  $('searchError').textContent = '';
  $('results').innerHTML = '';
}
$('cancelBtn').addEventListener('click', reset);

// ---------- Konfirmasi pengembalian ----------
$('retForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const date = $('f_retDate').value;
  const dateMsg = !date ? 'Return date is required'
    : date < selected.loanDate ? 'Return date cannot be before the loan date'
    : date > todayISO() ? 'Return date cannot be in the future' : '';
  const noteMsg = condition() !== 'Good' && !$('f_note').value.trim() ? 'Describe the book condition' : '';
  const okDate = fieldError('retDate', dateMsg);
  const okNote = fieldError('note', noteMsg);
  if (!okDate || !okNote) { (okDate ? $('f_note') : $('f_retDate')).focus(); return; }

  const lines = fineLines();
  selected.returnDate = date;
  selected.condition = condition();
  selected.note = $('f_note').value.trim();
  lines.forEach((x) => fines.push({
    id: nextId(fines), loanId: selected.id, memberId: selected.memberId, bookId: selected.bookId,
    type: x.type, days: x.days, amount: x.amount, status: 'Unpaid', method: '', paidOn: '', note: ''
  }));
  const book = books.find((b) => b.id === selected.bookId);
  if (book && condition() === 'Good') book.stock += 1; // Damaged/Lost: stok tidak bertambah

  saveLoans(loans);
  saveFines(fines);
  saveBooks(books);
  const total = lines.reduce((s, x) => s + x.amount, 0);
  reset();
  renderRecent();
  showToast(total ? `Return confirmed. Fine recorded: ${rupiah(total)}` : 'Return confirmed successfully');
});

// ---------- Pengembalian terbaru ----------
function renderRecent() {
  const list = loans.filter((l) => l.returnDate)
    .sort((a, b) => b.returnDate.localeCompare(a.returnDate) || b.id - a.id).slice(0, 8);
  $('recentBody').innerHTML = list.length ? list.map((l) => {
    const mine = fines.filter((f) => f.loanId === l.id);
    const total = mine.reduce((s, f) => s + f.amount, 0);
    const status = !mine.length ? '-' : mine.some((f) => f.status === 'Unpaid') ? chip('Unpaid')
      : mine.every((f) => f.status === 'Waived') ? chip('Waived') : chip('Paid');
    return `<tr><td>${loanCode(l)}</td><td>${person(memberName(l.memberId))}</td><td>${esc(bookTitle(l.bookId))}</td>
      <td>${fmtDate(l.returnDate)}</td><td>${chip(l.condition || 'Good')}</td><td>${total ? rupiah(total) : '-'}</td><td>${status}</td></tr>`;
  }).join('') : '<tr><td colspan="7" class="empty">No returns yet.</td></tr>';
}

// Buka langsung dari tombol Return di halaman Loans (?loan=ID)
const preset = Number(new URLSearchParams(location.search).get('loan'));
const presetLoan = loans.find((l) => l.id === preset && !l.returnDate);
if (presetLoan) pick(presetLoan);
else if (preset) $('searchError').textContent = 'That loan is already returned or does not exist.';

renderRecent();