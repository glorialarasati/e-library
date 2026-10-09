const TABS = ['All', 'Active', 'Inactive', 'Suspended'];
let page = 1;
let tab = 'All';
let editing = null;
let viewing = null;
let pending = null;

const matchTab = (m, t) => t === 'All' || m.status === t;

function render() {
  const q = $('search').value.trim().toLowerCase();
  const list = members.filter((m) => matchTab(m, tab) && (!q || [m.name, m.email, memberNo(m)].some((v) => v.toLowerCase().includes(q))));
  const pg = paginate(list, page);
  page = pg.page;

  $('sTotal').textContent = members.length;
  $('sActive').textContent = members.filter((m) => m.status === 'Active').length;
  $('sNew').textContent = members.filter((m) => m.joined.slice(0, 7) === todayISO().slice(0, 7)).length;
  $('sSusp').textContent = members.filter((m) => m.status === 'Suspended').length;
  renderTabs(TABS, tab, (t) => members.filter((m) => matchTab(m, t)).length);

  $('body').innerHTML = pg.rows.length ? pg.rows.map((m, i) => {
    const unpaid = unpaidOf(m.id);
    return `<tr>
      <td>${pg.start + i + 1}</td>
      <td><a href="#" data-view="${m.id}">${person(m.name, memberNo(m))}</a></td>
      <td>${esc(m.email)}</td><td>${esc(m.phone)}</td>
      <td>${activeLoansOf(m.id).length}</td>
      <td class="${unpaid ? 'text-error' : ''}">${unpaid ? rupiah(unpaid) : '-'}</td>
      <td>${fmtDate(m.joined)}</td><td>${chip(m.status)}</td>
      <td class="row-actions">
        <button class="icon-btn" data-view="${m.id}" aria-label="View ${esc(m.name)}"><span class="material-symbols-outlined" aria-hidden="true">visibility</span></button>
        <button class="icon-btn" data-edit="${m.id}" aria-label="Edit ${esc(m.name)}"><span class="material-symbols-outlined" aria-hidden="true">edit</span></button>
        <button class="icon-btn danger" data-delete="${m.id}" aria-label="Delete ${esc(m.name)}"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button>
      </td></tr>`;
  }).join('') : '<tr><td colspan="9" class="empty">No members found.</td></tr>';
  renderFoot(pg, list.length);
}

$('search').addEventListener('input', () => { page = 1; render(); });
bindPager((p) => { page = p; render(); });
bindTabs((t) => { tab = t; page = 1; render(); });

// ---------- Form tambah / edit ----------
const FIELDS = ['name', 'email', 'phone', 'address', 'status'];
const checks = {
  name: (v) => v.trim() ? '' : 'Full name is required',
  email: (v) => !v.trim() ? 'Email is required'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? 'Enter a valid email address'
    : members.some((m) => m.email.toLowerCase() === v.trim().toLowerCase() && (!editing || m.id !== editing.id)) ? 'Email is already registered' : '',
  phone: (v) => v && !/^[+\d][\d\s-]{6,}$/.test(v.trim()) ? 'Enter a valid phone number' : '',
  address: () => '',
  status: (v) => v ? '' : 'Select a status'
};
const validate = (n) => fieldError(n, checks[n]($(`f_${n}`).value));
FIELDS.forEach((n) => {
  $(`f_${n}`).addEventListener('blur', () => validate(n));
  $(`f_${n}`).addEventListener('input', () => { if ($(`field_${n}`).classList.contains('invalid')) validate(n); });
});

function openForm(m) {
  editing = m;
  $('formTitle').textContent = m ? 'Edit Member' : 'Add Member';
  $('memberNoText').textContent = m ? `Member number: ${memberNo(m)}` : 'Member number is generated automatically.';
  FIELDS.forEach((n) => { $(`f_${n}`).value = m ? m[n] : (n === 'status' ? 'Active' : ''); fieldError(n, ''); });
  $('formDialog').showModal();
  $('f_name').focus();
}
$('addBtn').addEventListener('click', () => openForm(null));

$('itemForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const bad = FIELDS.filter((n) => !validate(n));
  if (bad.length) { $(`f_${bad[0]}`).focus(); return; }
  const data = {};
  FIELDS.forEach((n) => { data[n] = $(`f_${n}`).value.trim(); });
  const wasEditing = Boolean(editing);
  if (editing) Object.assign(editing, data);
  else members.push({ id: nextId(members), joined: todayISO(), note: '', ...data });
  saveMembers(members);
  $('formDialog').close();
  render();
  showToast(`Member ${wasEditing ? 'updated' : 'added'} successfully`);
});

// ---------- Detail anggota ----------
function openView(m) {
  viewing = m;
  $('vName').textContent = m.name;
  $('vMeta').innerHTML = `${memberNo(m)} ${chip(m.status)}`;
  $('vFacts').textContent = `${m.email} | ${m.phone || '-'} | Joined ${fmtDate(m.joined)} | ${m.address || '-'}`;
  const mine = loans.filter((l) => l.memberId === m.id);
  const rows = (arr, cols) => arr.length ? arr.map((x) => `<tr>${cols(x).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('') : '<tr><td class="empty" colspan="4">Nothing to show.</td></tr>';
  $('vCurrent').innerHTML = rows(mine.filter((l) => !l.returnDate), (l) => [esc(bookTitle(l.bookId)), fmtDate(l.loanDate), fmtDate(l.dueDate), countdown(l)]);
  $('vHistory').innerHTML = rows(mine.filter((l) => l.returnDate), (l) => [esc(bookTitle(l.bookId)), fmtDate(l.loanDate), fmtDate(l.returnDate), chip(l.condition || 'Good')]);
  $('vFines').innerHTML = rows(fines.filter((f) => f.memberId === m.id), (f) => [chip(f.type), rupiah(f.amount), chip(f.status), esc(bookTitle(f.bookId))]);
  $('suspendBtn').textContent = m.status === 'Suspended' ? 'Reactivate Member' : 'Suspend Member';
  $('suspendBtn').className = `btn ${m.status === 'Suspended' ? 'btn-primary' : 'btn-outline-danger'}`;
  showPanel(0);
  $('viewDialog').showModal();
}
function showPanel(i) {
  document.querySelectorAll('[data-vtab]').forEach((b) => b.setAttribute('aria-selected', Number(b.dataset.vtab) === i));
  document.querySelectorAll('.vpanel').forEach((p, k) => { p.hidden = k !== i; });
}
document.querySelectorAll('[data-vtab]').forEach((b) => b.addEventListener('click', () => showPanel(Number(b.dataset.vtab))));
$('editFromView').addEventListener('click', () => { $('viewDialog').close(); openForm(viewing); });

// Suspend / reactivate
$('suspendBtn').addEventListener('click', () => {
  const suspended = viewing.status === 'Suspended';
  $('suspendTitle').textContent = suspended ? 'Reactivate this member?' : 'Suspend this member?';
  $('suspendText').textContent = suspended ? `${viewing.name} will be able to borrow books again.` : `${viewing.name} will not be able to borrow books until reactivated.`;
  $('f_reason').value = '';
  $('confirmSuspend').textContent = suspended ? 'Reactivate' : 'Suspend';
  $('suspendDialog').showModal();
});
$('confirmSuspend').addEventListener('click', () => {
  const suspended = viewing.status === 'Suspended';
  viewing.status = suspended ? 'Active' : 'Suspended';
  viewing.note = $('f_reason').value.trim();
  saveMembers(members);
  $('suspendDialog').close();
  $('viewDialog').close();
  render();
  showToast(suspended ? 'Member reactivated' : 'Member suspended');
});

// ---------- Hapus ----------
$('body').addEventListener('click', (e) => {
  const v = e.target.closest('[data-view]');
  const ed = e.target.closest('[data-edit]');
  const del = e.target.closest('[data-delete]');
  if (v) { e.preventDefault(); openView(members.find((m) => m.id === Number(v.dataset.view))); }
  if (ed) openForm(members.find((m) => m.id === Number(ed.dataset.edit)));
  if (del) {
    pending = members.find((m) => m.id === Number(del.dataset.delete));
    const active = activeLoansOf(pending.id).length;
    const unpaid = unpaidOf(pending.id);
    $('deleteText').textContent = `"${pending.name}" will be removed. This action cannot be undone.`;
    $('deleteWarn').hidden = !(active || unpaid);
    $('deleteWarn').textContent = `Cannot delete: this member has ${active} active loan(s) and ${unpaid ? rupiah(unpaid) : 'no'} unpaid fines. Settle them first.`;
    $('confirmDelete').disabled = Boolean(active || unpaid);
    $('deleteDialog').showModal();
  }
});
$('confirmDelete').addEventListener('click', () => {
  members = members.filter((m) => m.id !== pending.id);
  saveMembers(members);
  $('deleteDialog').close();
  render();
  showToast('Member deleted successfully');
});

render();