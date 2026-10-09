// E-book = buku bertipe "Digital" dari data buku yang sama dengan halaman Books.
const SEED = [['PDF', 4.8, 412, '2026-08-14'], ['EPUB', 2.1, 288, '2026-08-21'], ['PDF', 6.4, 356, '2026-09-02'], ['EPUB', 3.3, 201, '2026-09-09']];
const QUOTA_MB = 5120; // kuota penyimpanan 5 GB
let page = 1;
let pending = null;
let chosenFile = null;

// Lengkapi data e-book yang belum punya format, ukuran, dan jumlah unduhan
(function normalize() {
  let changed = false;
  books.filter((b) => b.type === 'Digital').forEach((b, i) => {
    if (b.format) return;
    const s = SEED[i] || ['PDF', 3, 0, todayISO()];
    const ext = /\.epub$/i.test(b.file || '') ? 'EPUB' : /\.pdf$/i.test(b.file || '') ? 'PDF' : s[0];
    Object.assign(b, { format: ext, fileSize: s[1], downloads: s[2], uploadedOn: s[3] });
    changed = true;
  });
  if (changed) saveBooks(books);
})();

const ebooks = () => books.filter((b) => b.type === 'Digital');
const cats = getCategories();
const mb = (n) => (n >= 1024 ? `${(n / 1024).toFixed(1)} GB` : `${n.toFixed(1)} MB`);

function coverTile(b, large) {
  const c = cats.find((x) => x.name === b.category);
  const ini = b.title.split(' ').filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return `<span class="cover${large ? ' large' : ''}" style="background:${c ? c.color : '#757575'}">${ini}</span>`;
}

function render() {
  const all = ebooks();
  const q = $('search').value.trim().toLowerCase();
  const list = all.filter((b) =>
    (!q || [b.title, b.author, b.isbn].some((v) => v.toLowerCase().includes(q))) &&
    (!$('filterCategory').value || b.category === $('filterCategory').value) &&
    (!$('filterFormat').value || b.format === $('filterFormat').value));
  const pg = paginate(list, page);
  page = pg.page;

  const used = all.reduce((s, b) => s + (b.fileSize || 0), 0);
  $('sTotal').textContent = all.length;
  $('sDownloads').textContent = all.reduce((s, b) => s + (b.downloads || 0), 0).toLocaleString('en-US');
  $('sStorage').textContent = mb(used);
  $('sBar').style.width = `${Math.max(1, Math.min(100, (used / QUOTA_MB) * 100))}%`;

  $('body').innerHTML = pg.rows.length ? pg.rows.map((b, i) => `
    <tr>
      <td>${pg.start + i + 1}</td>
      <td>${coverTile(b)}</td>
      <td><strong>${esc(b.title)}</strong><div class="mini-label">${esc(b.isbn)}</div></td>
      <td>${esc(b.author)}</td>
      <td><span class="chip chip-cat">${esc(b.category)}</span></td>
      <td><span class="chip chip-${b.format.toLowerCase()}">${b.format}</span></td>
      <td>${mb(b.fileSize || 0)}</td>
      <td>${(b.downloads || 0).toLocaleString('en-US')}</td>
      <td>${fmtDate(b.uploadedOn)}</td>
      <td class="row-actions">
        <button class="icon-btn" data-preview="${b.id}" aria-label="Preview ${esc(b.title)}"><span class="material-symbols-outlined" aria-hidden="true">visibility</span></button>
        <button class="icon-btn" data-download="${b.id}" aria-label="Download ${esc(b.title)}"><span class="material-symbols-outlined" aria-hidden="true">download</span></button>
        <a class="icon-btn" href="form.html?id=${b.id}" aria-label="Edit ${esc(b.title)}"><span class="material-symbols-outlined" aria-hidden="true">edit</span></a>
        <button class="icon-btn danger" data-delete="${b.id}" aria-label="Delete ${esc(b.title)}"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button>
      </td></tr>`).join('') : '<tr><td colspan="10" class="empty">No e-books found.</td></tr>';
  renderFoot(pg, list.length);
}

$('filterCategory').innerHTML += cats.map((c) => `<option>${esc(c.name)}</option>`).join('');
['search', 'filterCategory', 'filterFormat'].forEach((id) => $(id).addEventListener('input', () => { page = 1; render(); }));
bindPager((p) => { page = p; render(); });

// ---------- Aksi di tabel ----------
const find = (btn, attr) => books.find((b) => b.id === Number(btn.dataset[attr]));
$('body').addEventListener('click', (e) => {
  const pv = e.target.closest('[data-preview]');
  const dl = e.target.closest('[data-download]');
  const del = e.target.closest('[data-delete]');
  if (pv) {
    const b = find(pv, 'preview');
    $('pvCover').innerHTML = coverTile(b, true);
    $('pvTitle').textContent = b.title;
    $('pvMeta').textContent = `${b.author} | ${b.category}`;
    $('pvFacts').textContent = `${b.format} | ${mb(b.fileSize || 0)} | ISBN ${b.isbn} | ${(b.downloads || 0).toLocaleString('en-US')} downloads | Uploaded ${fmtDate(b.uploadedOn)}`;
    $('previewDialog').showModal();
  }
  if (dl) { // simulasi: hanya mencatat unduhan, tidak ada berkas nyata
    const b = find(dl, 'download');
    b.downloads = (b.downloads || 0) + 1;
    saveBooks(books);
    render();
    showToast(`Download recorded for "${b.title}" (demo, no real file)`);
  }
  if (del) {
    pending = find(del, 'delete');
    $('deleteText').textContent = `"${pending.title}" will be removed from the catalog. This action cannot be undone.`;
    $('deleteDialog').showModal();
  }
});
$('confirmDelete').addEventListener('click', () => {
  books = books.filter((b) => b.id !== pending.id);
  saveBooks(books);
  $('deleteDialog').close();
  render();
  showToast('E-book deleted successfully');
});

// ---------- Upload e-book ----------
const nameOptions = (names) => '<option value="">Select...</option>' + names.map((n) => `<option>${esc(n)}</option>`).join('');
const checks = {
  title: (v) => v.trim() ? '' : 'Book title is required',
  author: (v) => v ? '' : 'Select an author',
  category: (v) => v ? '' : 'Select a category',
  isbn: (v) => !v.trim() ? 'ISBN-13 is required'
    : !/^\d[\d-]{8,15}\d$/.test(v.trim()) ? 'Enter a valid ISBN (digits and hyphens)'
    : books.some((b) => b.isbn === v.trim()) ? 'This ISBN is already registered' : '',
  file: () => chosenFile ? '' : 'File is required'
};
const check = (n) => fieldError(n, checks[n]($(`f_${n}`).value));

Object.keys(checks).filter((n) => n !== 'file').forEach((n) => {
  $(`f_${n}`).addEventListener('blur', () => check(n));
  $(`f_${n}`).addEventListener('input', () => { if ($(`field_${n}`).classList.contains('invalid')) check(n); });
});

function openUpload() {
  chosenFile = null;
  $('uploadForm').reset();
  $('f_author').innerHTML = nameOptions(getAuthors().map((a) => a.name).sort());
  $('f_category').innerHTML = nameOptions(cats.map((c) => c.name));
  $('ebookName').textContent = 'PDF or EPUB';
  Object.keys(checks).forEach((n) => fieldError(n, ''));
  $('uploadDialog').showModal();
}
$('uploadBtn').addEventListener('click', openUpload);

function pickFile(file) {
  if (!/\.(pdf|epub)$/i.test(file.name)) {
    chosenFile = null;
    $('f_file').value = '';
    $('ebookName').textContent = 'PDF or EPUB';
    fieldError('file', 'Only PDF or EPUB files are accepted');
    return;
  }
  chosenFile = file;
  $('ebookName').textContent = `${file.name} (${(file.size / 1048576).toFixed(1)} MB)`;
  fieldError('file', '');
}
const zone = $('ebookZone');
zone.addEventListener('click', () => $('f_file').click());
zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('f_file').click(); } });
['dragenter', 'dragover'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('drag'); }));
['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove('drag'); }));
zone.addEventListener('drop', (e) => { if (e.dataTransfer.files[0]) pickFile(e.dataTransfer.files[0]); });
$('f_file').addEventListener('change', () => { if ($('f_file').files[0]) pickFile($('f_file').files[0]); });

$('uploadForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const bad = Object.keys(checks).filter((n) => !check(n));
  if (bad.length) { (bad[0] === 'file' ? zone : $(`f_${bad[0]}`)).focus(); return; }
  books.push({
    id: nextId(books), isbn: $('f_isbn').value.trim(), title: $('f_title').value.trim(), author: $('f_author').value,
    publisher: '', category: $('f_category').value, year: new Date().getFullYear(), stock: 99, price: 0, type: 'Digital',
    description: '', file: chosenFile.name, format: /\.epub$/i.test(chosenFile.name) ? 'EPUB' : 'PDF',
    fileSize: Math.max(0.1, Number((chosenFile.size / 1048576).toFixed(1))), downloads: 0, uploadedOn: todayISO()
  });
  saveBooks(books);
  $('uploadDialog').close();
  render();
  showToast('E-book uploaded successfully');
});

render();