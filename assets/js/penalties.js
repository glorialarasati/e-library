const TABS = ['All', 'Unpaid', 'Paid', 'Waived'];
let page = 1;
let tab = 'All';
let target = null;

const matchTab = (f, t) => t === 'All' || f.status === t;

function render() {
  const q = $('search').value.trim().toLowerCase();
  const type = $('filterType').value;
  const list = fines.filter((f) => matchTab(f, tab) && (!type || f.type === type) &&
    (!q || [memberName(f.memberId), bookTitle(f.bookId)].some((v) => v.toLowerCase().includes(q))))
    .sort((a, b) => b.id - a.id);
  const pg = paginate(list, page);
  page = pg.page;

  const unpaid = fines.filter((f) => f.status === 'Unpaid');
  const thisMonth = todayISO().slice(0, 7);
  $('sUnpaid').textContent = rupiah(unpaid.reduce((s, f) => s + f.amount, 0));
  $('sCollected').textContent = rupiah(fines.filter((f) => f.status === 'Paid' && f.paidOn.slice(0, 7) === thisMonth).reduce((s, f) => s + f.amount, 0));
  $('sMembers').textContent = new Set(unpaid.map((f) => f.memberId)).size;
  renderTabs(TABS, tab, (t) => fines.filter((f) => matchTab(f, t)).length);

  $('body').innerHTML = pg.rows.length ? pg.rows.map((f, i) => {
    const open = f.status === 'Unpaid';
    return `<tr>
      <td>${pg.start + i + 1}</td>
      <td>${person(memberName(f.memberId))}</td>
      <td>${esc(bookTitle(f.bookId))}</td>
      <td>${chip(f.type)}</td>
      <td>${f.type === 'Late' ? f.days : '-'}</td>
      <td><strong>${rupiah(f.amount)}</strong></td>
      <td>${chip(f.status)}</td>
      <td>${f.status === 'Paid' ? esc(f.method) : '-'}</td>
      <td>${f.status === 'Paid' ? fmtDate(f.paidOn) : '-'}</td>
      <td class="row-actions">
        <button class="icon-btn" data-pay="${f.id}" ${open ? '' : 'disabled'} aria-label="Mark as paid"><span class="material-symbols-outlined" aria-hidden="true">payments</span></button>
        <button class="icon-btn" data-waive="${f.id}" ${open ? '' : 'disabled'} aria-label="Waive fine"><span class="material-symbols-outlined" aria-hidden="true">money_off</span></button>
        <button class="icon-btn" data-view="${f.id}" aria-label="View fine"><span class="material-symbols-outlined" aria-hidden="true">visibility</span></button>
      </td></tr>`;
  }).join('') : '<tr><td colspan="10" class="empty">No fines found.</td></tr>';
  renderFoot(pg, list.length);
}

['search', 'filterType'].forEach((id) => $(id).addEventListener('input', () => { page = 1; render(); }));
bindPager((p) => { page = p; render(); });
bindTabs((t) => { tab = t; page = 1; render(); });

const summary = (f) => `${memberName(f.memberId)} | ${bookTitle(f.bookId)} | ${f.type} fine ${rupiah(f.amount)}`;
const byId = (btn, attr) => fines.find((f) => f.id === Number(btn.dataset[attr]));

$('body').addEventListener('click', (e) => {
  const pay = e.target.closest('[data-pay]');
  const waive = e.target.closest('[data-waive]');
  const view = e.target.closest('[data-view]');
  if (pay) {
    target = byId(pay, 'pay');
    $('payText').textContent = summary(target);
    $('f_method').value = '';
    $('f_paidOn').value = todayISO();
    $('f_paidOn').max = todayISO();
    ['method', 'paidOn'].forEach((n) => fieldError(n, ''));
    $('payDialog').showModal();
  }
  if (waive) {
    target = byId(waive, 'waive');
    $('waiveText').textContent = summary(target);
    $('f_reason').value = '';
    fieldError('reason', '');
    $('waiveDialog').showModal();
  }
  if (view) {
    const f = byId(view, 'view');
    const loan = loans.find((l) => l.id === f.loanId);
    const rows = [
      ['Loan', loan ? loanCode(loan) : '-'], ['Member', memberName(f.memberId)], ['Book', bookTitle(f.bookId)],
      ['Fine type', f.type], ['Days late', f.type === 'Late' ? f.days : '-'], ['Amount', rupiah(f.amount)],
      ['Status', f.status], ['Payment method', f.method || '-'], ['Paid on', fmtDate(f.paidOn)], ['Note', f.note || '-']
    ];
    $('viewBody').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
    $('viewDialog').showModal();
  }
});

// ---------- Bayar ----------
const payChecks = {
  method: (v) => v ? '' : 'Select a payment method',
  paidOn: (v) => !v ? 'Payment date is required' : v > todayISO() ? 'Payment date cannot be in the future' : ''
};
Object.keys(payChecks).forEach((n) => $(`f_${n}`).addEventListener('change', () => fieldError(n, payChecks[n]($(`f_${n}`).value))));

$('payForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const bad = Object.keys(payChecks).filter((n) => !fieldError(n, payChecks[n]($(`f_${n}`).value)));
  if (bad.length) { $(`f_${bad[0]}`).focus(); return; }
  Object.assign(target, { status: 'Paid', method: $('f_method').value, paidOn: $('f_paidOn').value });
  saveFines(fines);
  $('payDialog').close();
  render();
  showToast(`Payment of ${rupiah(target.amount)} recorded`);
});

// ---------- Bebaskan ----------
$('waiveForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const reason = $('f_reason').value.trim();
  if (!fieldError('reason', reason ? '' : 'Reason is required')) { $('f_reason').focus(); return; }
  Object.assign(target, { status: 'Waived', note: reason });
  saveFines(fines);
  $('waiveDialog').close();
  render();
  showToast('Fine waived');
});
$('f_reason').addEventListener('input', () => { if ($('field_reason').classList.contains('invalid')) fieldError('reason', $('f_reason').value.trim() ? '' : 'Reason is required'); });

render();