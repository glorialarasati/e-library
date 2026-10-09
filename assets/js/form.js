const $ = (id) => document.getElementById(id);
const editId = Number(new URLSearchParams(location.search).get('id')) || null;
let books = getBooks();
const editing = editId ? books.find((b) => b.id === editId) : null;
const thisYear = new Date().getFullYear();

// ---------- Isi dropdown ----------
const authors = getAuthors().map((a) => a.name).sort();
const options = (list) => '<option value="">Select...</option>' + list.map((v) => `<option>${esc(v)}</option>`).join('');
$('author').innerHTML = options(authors);
$('publisher').innerHTML = options(getPublishers().map((p) => p.name));
$('category').innerHTML = options(getCategories().map((c) => c.name));

// ---------- Mode tambah / edit ----------
const mode = editing ? 'Edit Book' : 'Add Book';
document.title = `${mode} | E-Library Admin`;
$('formTitle').textContent = mode;
$('crumb').textContent = mode;
$('subtitle').textContent = editing ? `Update the details of "${editing.title}"` : 'Register a new book in the catalog';

if (editing) {
  ['isbn', 'title', 'author', 'publisher', 'category', 'year', 'stock', 'price', 'description'].forEach((f) => {
    $(f).value = editing[f] ?? '';
  });
  document.querySelector(`input[name="type"][value="${editing.type}"]`).checked = true;
  if (editing.file) $('ebookName').textContent = editing.file;
} else if (editId) {
  showToast('Book not found. Adding a new book instead.');
}

// ---------- Validasi ----------
const currentType = () => document.querySelector('input[name="type"]:checked').value;
const needInt = (v, label, min) =>
  v === '' ? `${label} is required` : (!Number.isInteger(Number(v)) || Number(v) < min) ? `${label} must be a whole number of ${min} or more` : '';

const rules = {
  isbn: (v) => !v.trim() ? 'ISBN is required'
    : !/^\d[\d-]{8,15}\d$/.test(v.trim()) ? 'Enter a valid ISBN (digits and hyphens, 10-17 characters)'
    : books.some((b) => b.isbn === v.trim() && b.id !== editId) ? 'This ISBN is already registered' : '',
  title: (v) => v.trim() ? '' : 'Book title is required',
  author: (v) => v ? '' : 'Select an author',
  publisher: (v) => v ? '' : 'Select a publisher',
  category: (v) => v ? '' : 'Select a category',
  year: (v) => v === '' ? 'Publication year is required'
    : (!Number.isInteger(Number(v)) || Number(v) < 1000 || Number(v) > thisYear) ? `Enter a year between 1000 and ${thisYear}` : '',
  stock: (v) => needInt(v, 'Stock', 0),
  price: (v) => needInt(v, 'Price', 0),
  ebook: () => currentType() === 'Digital' && !$('ebook').files[0] && !(editing && editing.file)
    ? 'Upload the e-book file (PDF or EPUB)' : ''
};

function setError(name, message) {
  $(`field-${name}`).classList.toggle('invalid', Boolean(message));
  $(`err-${name}`).textContent = message;
  $(name).setAttribute('aria-invalid', Boolean(message));
}
function validate(name) {
  const message = rules[name]($(name).value);
  setError(name, message);
  return !message;
}

Object.keys(rules).filter((n) => n !== 'ebook').forEach((name) => {
  $(name).addEventListener('blur', () => validate(name));
  $(name).addEventListener('input', () => { if ($(`field-${name}`).classList.contains('invalid')) validate(name); });
});

// ---------- Tipe buku: tampilkan upload e-book ----------
function toggleEbook() {
  const digital = currentType() === 'Digital';
  $('field-ebook').hidden = !digital;
  if (!digital) setError('ebook', '');
}
document.querySelectorAll('input[name="type"]').forEach((r) => r.addEventListener('change', toggleEbook));
toggleEbook();

// ---------- Drag and drop ----------
function setupDrop(zone, input, onFile) {
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  ['dragenter', 'dragover'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove('drag'); }));
  zone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length) { input.files = e.dataTransfer.files; input.dispatchEvent(new Event('change')); }
  });
  input.addEventListener('change', () => input.files[0] && onFile(input.files[0]));
}

setupDrop($('coverZone'), $('cover'), (file) => {
  if (!file.type.startsWith('image/')) { $('cover').value = ''; showToast('Please choose an image file'); return; }
  $('coverName').textContent = file.name;
  $('coverPreview').src = URL.createObjectURL(file);
  $('coverPreview').hidden = false;
});

setupDrop($('ebookZone'), $('ebook'), (file) => {
  if (!/\.(pdf|epub)$/i.test(file.name)) {
    $('ebook').value = '';
    setError('ebook', 'Only PDF or EPUB files are accepted');
    return;
  }
  $('ebookName').textContent = `${file.name} (${(file.size / 1048576).toFixed(1)} MB)`;
  setError('ebook', '');
});

// ---------- Simpan ----------
$('bookForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const results = Object.keys(rules).map((name) => [name, validate(name)]);
  const firstBad = results.find(([, ok]) => !ok);
  if (firstBad) {
    const el = firstBad[0] === 'ebook' ? $('ebookZone') : $(firstBad[0]);
    el.focus();
    showToast('Please fix the highlighted fields');
    return;
  }

  const digital = currentType() === 'Digital';
  const data = {
    isbn: $('isbn').value.trim(), title: $('title').value.trim(), author: $('author').value,
    publisher: $('publisher').value, category: $('category').value,
    year: Number($('year').value), stock: Number($('stock').value), price: Number($('price').value),
    type: currentType(), description: $('description').value.trim(),
    file: digital ? ($('ebook').files[0]?.name || editing?.file || '') : ''
  };

  if (editing) {
    books = books.map((b) => (b.id === editId ? { ...b, ...data } : b));
  } else {
    books.push({ id: Math.max(0, ...books.map((b) => b.id)) + 1, ...data });
  }
  saveBooks(books);
  location.href = `data-master.html?msg=${editing ? 'updated' : 'added'}`;
});