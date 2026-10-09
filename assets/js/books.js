const PER_PAGE = 8;
const CATS = getCategories();
let books = getBooks();
let page = 1;
let pendingDelete = null;

const $ = (id) => document.getElementById(id);

function bookStatus(b) {
  if (b.stock === 0) return ['Out of Stock', 'out'];
  if (b.stock <= LOW_STOCK_THRESHOLD) return ['Low Stock', 'low'];
  return ['Available', 'available'];
}

function coverTile(b) {
  const cat = CATS.find((c) => c.name === b.category);
  const initials = b.title.split(' ').filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return `<span class="cover" style="background:${cat ? cat.color : '#757575'}">${initials}</span>`;
}

function filteredBooks() {
  const q = $('search').value.trim().toLowerCase();
  const cat = $('filterCategory').value;
  const status = $('filterStatus').value;
  return books.filter((b) =>
    (!q || [b.title, b.author, b.isbn].some((v) => v.toLowerCase().includes(q))) &&
    (!cat || b.category === cat) &&
    (!status || bookStatus(b)[0] === status));
}

function render() {
  const list = filteredBooks();
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  if (page > pages) page = pages;
  const start = (page - 1) * PER_PAGE;
  const rows = list.slice(start, start + PER_PAGE);

  $('booksBody').innerHTML = rows.length ? rows.map((b, i) => {
    const [label, tone] = bookStatus(b);
    return `<tr>
      <td>${start + i + 1}</td>
      <td>${coverTile(b)}</td>
      <td>${esc(b.isbn)}</td>
      <td><strong>${esc(b.title)}</strong></td>
      <td>${esc(b.author)}</td>
      <td><span class="chip chip-cat">${esc(b.category)}</span></td>
      <td>${b.year}</td>
      <td>${b.stock}</td>
      <td><span class="chip chip-${b.type.toLowerCase()}">${b.type}</span></td>
      <td><span class="chip chip-${tone}">${label}</span></td>
      <td class="row-actions">
        <a class="icon-btn" href="form.html?id=${b.id}" aria-label="Edit ${esc(b.title)}"><span class="material-symbols-outlined" aria-hidden="true">edit</span></a>
        <button class="icon-btn danger" data-delete="${b.id}" aria-label="Delete ${esc(b.title)}"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button>
      </td></tr>`;
  }).join('') : '<tr><td colspan="11" class="empty">No books match your filters.</td></tr>';

  $('subtitle').textContent = `${books.length} titles in the catalog`;
  $('pageInfo').textContent = list.length
    ? `Showing ${start + 1}-${start + rows.length} of ${list.length} entries`
    : 'Showing 0 entries';

  let buttons = `<button class="page-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Previous page">&lsaquo;</button>`;
  for (let p = 1; p <= pages; p++) {
    buttons += `<button class="page-btn" data-page="${p}" ${p === page ? 'aria-current="page"' : ''}>${p}</button>`;
  }
  buttons += `<button class="page-btn" data-page="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Next page">&rsaquo;</button>`;
  $('pager').innerHTML = buttons;
}

// Isi dropdown kategori
$('filterCategory').innerHTML += CATS.map((c) => `<option>${c.name}</option>`).join('');

// Filter dan pencarian
['search', 'filterCategory', 'filterStatus'].forEach((id) => {
  $(id).addEventListener('input', () => { page = 1; render(); });
});

// Pagination
$('pager').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-page]');
  if (btn && !btn.disabled) { page = Number(btn.dataset.page); render(); }
});

// Hapus: buka modal konfirmasi
$('booksBody').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-delete]');
  if (!btn) return;
  pendingDelete = books.find((b) => b.id === Number(btn.dataset.delete));
  $('deleteText').textContent = `"${pendingDelete.title}" will be removed from the catalog. This action cannot be undone.`;
  $('deleteDialog').showModal();
});
$('cancelDelete').addEventListener('click', () => $('deleteDialog').close());
$('confirmDelete').addEventListener('click', () => {
  books = books.filter((b) => b.id !== pendingDelete.id);
  saveBooks(books);
  $('deleteDialog').close();
  render();
  showToast('Book deleted successfully');
});

// Pesan setelah kembali dari halaman form
const msg = new URLSearchParams(location.search).get('msg');
if (msg === 'added') showToast('Book added successfully');
if (msg === 'updated') showToast('Book updated successfully');

render();