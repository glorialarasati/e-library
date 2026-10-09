// CRUD data master. Satu skrip dipakai tiga halaman; konfigurasi dipilih dari <body data-entity="...">.
const $ = (id) => document.getElementById(id);
const PER_PAGE = 8;
const ICONS = ['menu_book', 'science', 'account_balance', 'child_care', 'person', 'palette', 'public', 'psychology', 'sports_esports', 'restaurant'];
const NATIONALITIES = ['American', 'British', 'Austrian', 'Israeli', 'South African', 'Indonesian', 'Other'];
const COUNTRIES = ['Indonesia', 'United States', 'United Kingdom', 'Other'];

const initials = (name) => name.split(' ').filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const ENTITIES = {
  categories: {
    singular: 'Category', plural: 'Categories', get: getCategories, save: saveCategories, bookField: 'category',
    search: ['name', 'description'], defaults: { color: '#3F51B5', icon: 'menu_book' },
    fields: [
      { name: 'name', label: 'Category Name', type: 'text', required: 'Category name is required' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'color', label: 'Color', type: 'color' },
      { name: 'icon', label: 'Icon', type: 'select', options: ICONS, required: 'Select an icon' }
    ],
    columns: [
      { head: 'Icon', cell: (c) => `<span class="icon-tile" style="background:${c.color}22;color:${c.color}"><span class="material-symbols-outlined" aria-hidden="true">${esc(c.icon)}</span></span>` },
      { head: 'Category Name', cell: (c) => `<strong>${esc(c.name)}</strong>` },
      { head: 'Description', cell: (c) => esc(c.description || '-') },
      { head: 'Total Books', cell: (c, n, total) => {
        const pct = total ? Math.round((n / total) * 100) : 0;
        return `<div class="mini-label">${n} books (${pct}%)</div><div class="mini-bar"><span style="width:${pct}%;background:${c.color}"></span></div>`;
      } }
    ]
  },
  authors: {
    singular: 'Author', plural: 'Authors', get: getAuthors, save: saveAuthors, bookField: 'author',
    search: ['name', 'nationality'], defaults: { nationality: '', status: 'Pending' },
    fields: [
      { name: 'name', label: 'Author Name', type: 'text', required: 'Author name is required' },
      { name: 'nationality', label: 'Nationality', type: 'select', options: NATIONALITIES, required: 'Select a nationality' },
      { name: 'status', label: 'Status', type: 'select', options: ['Verified', 'Pending'], required: 'Select a status' },
      { name: 'biography', label: 'Biography', type: 'textarea' }
    ],
    columns: [
      { head: 'Author', cell: (a) => `<span class="name-cell"><span class="avatar">${esc(initials(a.name))}</span><strong>${esc(a.name)}</strong></span>` },
      { head: 'Nationality', cell: (a) => esc(a.nationality) },
      { head: 'Total Books', cell: (a, n) => `${n} titles` },
      { head: 'Status', cell: (a) => `<span class="chip chip-${a.status === 'Verified' ? 'available' : 'low'}">${esc(a.status)}</span>` }
    ]
  },
  publishers: {
    singular: 'Publisher', plural: 'Publishers', get: getPublishers, save: savePublishers, bookField: 'publisher',
    search: ['name', 'city', 'country', 'email'], defaults: { country: '' }, extra: { titles: 0 },
    fields: [
      { name: 'name', label: 'Publisher Name', type: 'text', required: 'Publisher name is required' },
      { name: 'city', label: 'City', type: 'text', required: 'City is required' },
      { name: 'country', label: 'Country', type: 'select', options: COUNTRIES, required: 'Select a country' },
      { name: 'email', label: 'Email', type: 'email', required: 'Email is required' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'address', label: 'Address', type: 'textarea' }
    ],
    columns: [
      { head: 'Publisher', cell: (p) => `<span class="name-cell"><span class="avatar square">${esc(p.name[0].toUpperCase())}</span><strong>${esc(p.name)}</strong></span>` },
      { head: 'City', cell: (p) => esc(p.city) },
      { head: 'Country', cell: (p) => esc(p.country) },
      { head: 'Email / Phone', cell: (p) => `${esc(p.email)}<div class="mini-label">${esc(p.phone || '-')}</div>` },
      { head: 'Titles Supplied', cell: (p) => p.titles }
    ]
  }
};

const cfg = ENTITIES[document.body.dataset.entity];
let items = cfg.get();
let books = getBooks();
let page = 1;
let editing = null;
let pending = null;

const booksOf = (item) => books.filter((b) => b[cfg.bookField] === item.name).length;

// ---------- Tabel ----------
$('head').innerHTML = `<tr><th>No</th>${cfg.columns.map((c) => `<th>${c.head}</th>`).join('')}<th style="text-align:right">Actions</th></tr>`;

function render() {
  const q = $('search').value.trim().toLowerCase();
  const list = items.filter((it) => !q || cfg.search.some((k) => String(it[k] || '').toLowerCase().includes(q)));
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  if (page > pages) page = pages;
  const start = (page - 1) * PER_PAGE;
  const rows = list.slice(start, start + PER_PAGE);

  $('body').innerHTML = rows.length ? rows.map((it, i) => `
    <tr>
      <td>${start + i + 1}</td>
      ${cfg.columns.map((c) => `<td>${c.cell(it, booksOf(it), books.length)}</td>`).join('')}
      <td class="row-actions">
        <button class="icon-btn" data-edit="${it.id}" aria-label="Edit ${esc(it.name)}"><span class="material-symbols-outlined" aria-hidden="true">edit</span></button>
        <button class="icon-btn danger" data-delete="${it.id}" aria-label="Delete ${esc(it.name)}"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button>
      </td>
    </tr>`).join('') : `<tr><td colspan="${cfg.columns.length + 2}" class="empty">No ${cfg.plural.toLowerCase()} found.</td></tr>`;

  $('subtitle').textContent = `${items.length} ${cfg.plural.toLowerCase()} registered`;
  $('pageInfo').textContent = list.length ? `Showing ${start + 1}-${start + rows.length} of ${list.length} entries` : 'Showing 0 entries';
  $('pager').innerHTML =
    `<button class="page-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Previous page">&lsaquo;</button>` +
    Array.from({ length: pages }, (_, i) => `<button class="page-btn" data-page="${i + 1}" ${i + 1 === page ? 'aria-current="page"' : ''}>${i + 1}</button>`).join('') +
    `<button class="page-btn" data-page="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Next page">&rsaquo;</button>`;
}

$('search').addEventListener('input', () => { page = 1; render(); });
$('pager').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-page]');
  if (btn && !btn.disabled) { page = Number(btn.dataset.page); render(); }
});

// ---------- Form tambah / edit ----------
$('formFields').innerHTML = cfg.fields.map((f) => {
  const id = `f_${f.name}`;
  const control = f.type === 'textarea' ? `<textarea id="${id}" rows="3"></textarea>`
    : f.type === 'select' ? `<select id="${id}"><option value="">Select...</option>${f.options.map((o) => `<option>${esc(o)}</option>`).join('')}</select>`
    : `<input id="${id}" type="${f.type === 'email' ? 'email' : f.type}">`;
  return `<div class="field${f.type === 'textarea' ? ' field-full' : ''}" id="field_${f.name}">
    <label for="${id}">${f.label}${f.required ? ' *' : ''}</label>${control}<p class="error" id="err_${f.name}"></p></div>`;
}).join('');

function setError(name, message) {
  $(`field_${name}`).classList.toggle('invalid', Boolean(message));
  $(`err_${name}`).textContent = message;
  $(`f_${name}`).setAttribute('aria-invalid', Boolean(message));
}

function validate(f) {
  const value = $(`f_${f.name}`).value.trim();
  let message = '';
  if (f.required && !value) message = f.required;
  else if (f.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = 'Enter a valid email address';
  else if (f.name === 'name' && items.some((it) => it.name.toLowerCase() === value.toLowerCase() && (!editing || it.id !== editing.id))) {
    message = `This ${cfg.singular.toLowerCase()} already exists`;
  }
  setError(f.name, message);
  return !message;
}

cfg.fields.forEach((f) => {
  $(`f_${f.name}`).addEventListener('blur', () => validate(f));
  $(`f_${f.name}`).addEventListener('input', () => { if ($(`field_${f.name}`).classList.contains('invalid')) validate(f); });
});

function openForm(item) {
  editing = item;
  $('formTitle').textContent = `${item ? 'Edit' : 'Add'} ${cfg.singular}`;
  cfg.fields.forEach((f) => {
    $(`f_${f.name}`).value = item ? (item[f.name] ?? '') : (cfg.defaults[f.name] ?? '');
    setError(f.name, '');
  });
  $('formDialog').showModal();
  $(`f_${cfg.fields[0].name}`).focus();
}

$('addBtn').addEventListener('click', () => openForm(null));
$('cancelForm').addEventListener('click', () => $('formDialog').close());

$('itemForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const results = cfg.fields.map((f) => [f, validate(f)]);
  const bad = results.find(([, ok]) => !ok);
  if (bad) { $(`f_${bad[0].name}`).focus(); return; }

  const data = {};
  cfg.fields.forEach((f) => { data[f.name] = $(`f_${f.name}`).value.trim(); });

  if (editing) {
    const oldName = editing.name;
    Object.assign(editing, data);
    if (data.name !== oldName) { // ganti nama: perbarui buku yang memakainya
      books.forEach((b) => { if (b[cfg.bookField] === oldName) b[cfg.bookField] = data.name; });
      saveBooks(books);
    }
  } else {
    items.push({ id: Math.max(0, ...items.map((it) => it.id)) + 1, ...(cfg.extra || {}), ...data });
  }
  cfg.save(items);
  $('formDialog').close();
  render();
  showToast(`${cfg.singular} ${editing ? 'updated' : 'added'} successfully`);
});

// ---------- Hapus ----------
$('body').addEventListener('click', (e) => {
  const edit = e.target.closest('[data-edit]');
  const del = e.target.closest('[data-delete]');
  if (edit) openForm(items.find((it) => it.id === Number(edit.dataset.edit)));
  if (del) {
    pending = items.find((it) => it.id === Number(del.dataset.delete));
    const n = booksOf(pending);
    $('deleteTitle').textContent = `Delete this ${cfg.singular.toLowerCase()}?`;
    $('deleteText').textContent = `"${pending.name}" will be removed. This action cannot be undone.`;
    $('deleteWarn').hidden = n === 0;
    $('deleteWarn').textContent = `Cannot delete: ${n} book${n === 1 ? '' : 's'} in the catalog still use this ${cfg.singular.toLowerCase()}. Reassign or delete them first.`;
    $('confirmDelete').disabled = n > 0;
    $('deleteDialog').showModal();
  }
});
$('cancelDelete').addEventListener('click', () => $('deleteDialog').close());
$('confirmDelete').addEventListener('click', () => {
  items = items.filter((it) => it.id !== pending.id);
  cfg.save(items);
  $('deleteDialog').close();
  render();
  showToast(`${cfg.singular} deleted successfully`);
});

render();