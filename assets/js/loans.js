const TABS = ['All', 'Borrowed', 'Due Soon', 'Overdue'];
let page = 1;
let tab = 'All';
let extending = null;

const matchTab = (l, t) => t === 'All' ? true : !l.returnDate && loanStatus(l) === t;

function render() {
  const q = $('search').value.trim().toLowerCase();
  const date = $('filterDate').value;
  const list = loans.filter((l) => matchTab(l, tab) && (!date || l.loanDate === date) &&
    (!q || [loanCode(l), memberName(l.memberId), bookTitle(l.bookId)].some((v) => v.toLowerCase().includes(q))))
    .sort((a, b) => b.id - a.id);
  const pg = paginate(list, page);
  page = pg.page;

  const open = loans.filter((l) => !l.returnDate);
  $('sActive').textContent = open.length;
  $('sWeek').textContent = open.filter((l) => { const d = diffDays(l.dueDate, todayISO()); return d >= 0 && d <= 7; }).length;
  $('sOver').textContent = open.filter((l) => loanStatus(l) === 'Overdue').length;
  renderTabs(TABS, tab, (t) => loans.filter((l) => matchTab(l, t)).length);

  $('body').innerHTML = pg.rows.length ? pg.rows.map((l) => `
    <tr>
      <td>${loanCode(l)}</td>
      <td>${person(memberName(l.memberId))}</td>
      <td>${esc(bookTitle(l.bookId))}</td>
      <td>${fmtDate(l.loanDate)}</td>
      <td>${fmtDate(l.dueDate)} ${countdown(l)}</td>
      <td>${chip(loanStatus(l))}</td>
      <td class="row-actions">${l.returnDate ? '<span class="mini-label">Returned</span>' : `
        <a class="icon-btn" href="returns.html?loan=${l.id}" aria-label="Return ${loanCode(l)}"><span class="material-symbols-outlined" aria-hidden="true">keyboard_return</span></a>
        <button class="icon-btn" data-extend="${l.id}" aria-label="Extend ${loanCode(l)}"><span class="material-symbols-outlined" aria-hidden="true">event_repeat</span></button>`}
      </td></tr>`).join('') : '<tr><td colspan="7" class="empty">No loans found.</td></tr>';
  renderFoot(pg, list.length);
}

['search', 'filterDate'].forEach((id) => $(id).addEventListener('input', () => { page = 1; render(); }));
bindPager((p) => { page = p; render(); });
bindTabs((t) => { tab = t; page = 1; render(); });

// ---------- Pinjaman baru ----------
function openNew() {
  const s = getSettings();
  $('f_member').innerHTML = optionList(members.filter((m) => m.status === 'Active'), (m) => `${m.name} (${memberNo(m)})`);
  $('f_book').innerHTML = optionList(books.filter((b) => b.stock > 0), (b) => `${b.title} (stock ${b.stock})`);
  $('f_loanDate').value = todayISO();
  $('f_dueDate').value = addDays(todayISO(), s.loanDays);
  ['member', 'book', 'loanDate', 'dueDate'].forEach((n) => fieldError(n, ''));
  $('newDialog').showModal();
}
$('addBtn').addEventListener('click', openNew);
$('f_loanDate').addEventListener('change', () => { $('f_dueDate').value = addDays($('f_loanDate').value, getSettings().loanDays); });

const newChecks = {
  member: (v) => {
    if (!v) return 'Select a member';
    return activeLoansOf(Number(v)).length >= getSettings().maxLoans ? `This member already has ${getSettings().maxLoans} active loans` : '';
  },
  book: (v) => v ? '' : 'Select a book',
  loanDate: (v) => v ? '' : 'Loan date is required',
  dueDate: (v) => !v ? 'Due date is required' : v < $('f_loanDate').value ? 'Due date must be after the loan date' : ''
};
Object.keys(newChecks).forEach((n) => $(`f_${n}`).addEventListener('change', () => fieldError(n, newChecks[n]($(`f_${n}`).value))));

$('newForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const bad = Object.keys(newChecks).filter((n) => !fieldError(n, newChecks[n]($(`f_${n}`).value)));
  if (bad.length) { $(`f_${bad[0]}`).focus(); return; }
  const book = books.find((b) => b.id === Number($('f_book').value));
  loans.push({
    id: nextId(loans), memberId: Number($('f_member').value), bookId: book.id,
    loanDate: $('f_loanDate').value, dueDate: $('f_dueDate').value, returnDate: '', condition: '', note: '', extensions: 0
  });
  book.stock -= 1;
  saveLoans(loans);
  saveBooks(books);
  $('newDialog').close();
  render();
  showToast('Loan saved successfully');
});

// ---------- Perpanjang ----------
$('body').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-extend]');
  if (!btn) return;
  extending = loans.find((l) => l.id === Number(btn.dataset.extend));
  const s = getSettings();
  $('extendText').textContent = `${loanCode(extending)}: ${bookTitle(extending.bookId)}. Current due date ${fmtDate(extending.dueDate)}.`;
  $('f_newDue').value = addDays(extending.dueDate, s.extensionDays);
  $('f_newDue').min = addDays(extending.dueDate, 1);
  fieldError('newDue', extending.extensions >= s.maxExtensions ? `Maximum of ${s.maxExtensions} extension(s) reached` : '');
  $('extendDialog').showModal();
});
$('extendForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const s = getSettings();
  const v = $('f_newDue').value;
  const msg = extending.extensions >= s.maxExtensions ? `Maximum of ${s.maxExtensions} extension(s) reached`
    : !v || v <= extending.dueDate ? 'Choose a date after the current due date' : '';
  if (!fieldError('newDue', msg)) return;
  extending.dueDate = v;
  extending.extensions += 1;
  saveLoans(loans);
  $('extendDialog').close();
  render();
  showToast('Due date extended');
});

render();