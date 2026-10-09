// Mock data (tanpa back-end). Dipakai bersama oleh beberapa halaman.
const MONTHS = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
const LOANS_PER_MONTH = [130, 148, 165, 142, 188, 174];
const RETURNS_PER_MONTH = [118, 135, 152, 130, 165, 154];

const CATEGORIES = [
  { name: 'Fiction', count: 320, color: '#3F51B5' },
  { name: 'Science & Tech', count: 240, color: '#009688' },
  { name: 'History', count: 180, color: '#FFB300' },
  { name: 'Children', count: 190, color: '#E91E63' },
  { name: 'Biography', count: 150, color: '#9C27B0' },
  { name: 'Art & Design', count: 170, color: '#03A9F4' }
];

const RECENT_LOANS = [
  { member: 'Sari Wulandari', book: 'Atomic Habits', loanDate: 'Oct 06, 2026', dueDate: 'Oct 13, 2026', status: 'Borrowed' },
  { member: 'Andi Pratama', book: 'Dune', loanDate: 'Oct 05, 2026', dueDate: 'Oct 12, 2026', status: 'Borrowed' },
  { member: 'Maya Putri', book: 'Sapiens', loanDate: 'Sep 28, 2026', dueDate: 'Oct 05, 2026', status: 'Overdue' },
  { member: 'Fajar Nugroho', book: 'Clean Code', loanDate: 'Sep 30, 2026', dueDate: 'Oct 07, 2026', status: 'Returned' },
  { member: 'Lina Marlina', book: 'Educated', loanDate: 'Oct 02, 2026', dueDate: 'Oct 09, 2026', status: 'Returned' }
];

// ===== Data buku (disimpan di localStorage agar dipakai halaman form) =====
const LOW_STOCK_THRESHOLD = 5;
const BOOKS_KEY = 'elib_books';

const DEFAULT_BOOKS = [
  ['Atomic Habits', 'James Clear', 'Science & Tech', 2018, 22, 'Physical', 95000],
  ['The Midnight Library', 'Matt Haig', 'Fiction', 2020, 14, 'Physical', 89000],
  ['Dune', 'Frank Herbert', 'Fiction', 1965, 3, 'Physical', 110000],
  ['Sapiens', 'Yuval Noah Harari', 'History', 2011, 18, 'Digital', 120000],
  ['Clean Code', 'Robert C. Martin', 'Science & Tech', 2008, 9, 'Physical', 250000],
  ['Educated', 'Tara Westover', 'Biography', 2018, 11, 'Physical', 98000],
  ['The Hobbit', 'J.R.R. Tolkien', 'Fiction', 1937, 7, 'Physical', 85000],
  ['Cosmos', 'Carl Sagan', 'Science & Tech', 1980, 5, 'Physical', 105000],
  ['Guns, Germs, and Steel', 'Jared Diamond', 'History', 1997, 12, 'Physical', 130000],
  ['Where the Wild Things Are', 'Maurice Sendak', 'Children', 1963, 16, 'Physical', 70000],
  ['Matilda', 'Roald Dahl', 'Children', 1988, 0, 'Physical', 65000],
  ['Steve Jobs', 'Walter Isaacson', 'Biography', 2011, 8, 'Digital', 140000],
  ['The Story of Art', 'E.H. Gombrich', 'Art & Design', 1950, 6, 'Physical', 220000],
  ['Homo Deus', 'Yuval Noah Harari', 'History', 2015, 13, 'Digital', 118000],
  ['Becoming', 'Michelle Obama', 'Biography', 2018, 10, 'Physical', 135000],
  ['The Design of Everyday Things', 'Don Norman', 'Art & Design', 1988, 4, 'Physical', 160000],
  ["Charlotte's Web", 'E.B. White', 'Children', 1952, 19, 'Physical', 60000],
  ['Brave New World', 'Aldous Huxley', 'Fiction', 1932, 9, 'Physical', 80000],
  ['A Brief History of Time', 'Stephen Hawking', 'Science & Tech', 1988, 15, 'Digital', 115000],
  ['Born a Crime', 'Trevor Noah', 'Biography', 2016, 12, 'Physical', 100000]
].map((b, i) => ({
  id: i + 1, isbn: `978-602-${1000 + i * 13}-${i % 10}`,
  title: b[0], author: b[1], category: b[2], year: b[3], stock: b[4], type: b[5], price: b[6]
}));

function getBooks() {
  try {
    const saved = JSON.parse(localStorage.getItem(BOOKS_KEY));
    if (Array.isArray(saved)) return saved;
  } catch (e) { /* abaikan, pakai data bawaan */ }
  return DEFAULT_BOOKS.map((b) => ({ ...b }));
}
function saveBooks(list) { localStorage.setItem(BOOKS_KEY, JSON.stringify(list)); }

// Escape teks agar aman ditampilkan sebagai HTML
function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

const PUBLISHERS = ['Gramedia Pustaka', 'Penguin Random', 'HarperCollins', 'Oxford Press', 'Scholastic', 'Mizan Media'];

// ===== Data laporan peminjaman (mock) =====
const LOAN_REPORT = [
  ['Sari Wulandari', 'Atomic Habits', '2026-09-02', '2026-09-08'],
  ['Andi Pratama', 'Dune', '2026-09-03', '2026-09-14'],
  ['Maya Putri', 'Sapiens', '2026-09-05', '2026-09-12'],
  ['Fajar Nugroho', 'Clean Code', '2026-09-06', '2026-09-20'],
  ['Lina Marlina', 'Educated', '2026-09-08', '2026-09-15'],
  ['Rudi Hartono', 'The Hobbit', '2026-09-09', '2026-09-16'],
  ['Nadia Safitri', 'Cosmos', '2026-09-10', '2026-09-24'],
  ['Bagas Setiawan', 'Homo Deus', '2026-09-12', '2026-09-19'],
  ['Citra Anggraini', 'Matilda', '2026-09-14', '2026-09-21'],
  ['Dimas Prakoso', 'Steve Jobs', '2026-09-15', ''],
  ['Eka Rahmawati', 'Becoming', '2026-09-17', '2026-09-23'],
  ['Gilang Ramadhan', 'Brave New World', '2026-09-18', '2026-09-30'],
  ['Hana Permata', 'Born a Crime', '2026-09-21', '2026-09-28'],
  ['Indra Gunawan', 'A Brief History of Time', '2026-09-23', '2026-09-30'],
  ['Joko Susilo', 'The Story of Art', '2026-09-25', '2026-10-08'],
  ['Kartika Sari', "Charlotte's Web", '2026-09-28', '2026-10-05'],
  ['Sari Wulandari', 'Dune', '2026-10-01', '2026-10-07'],
  ['Andi Pratama', 'Sapiens', '2026-10-02', ''],
  ['Maya Putri', 'Cosmos', '2026-10-05', ''],
  ['Fajar Nugroho', 'Atomic Habits', '2026-10-06', ''],
  ['Lina Marlina', 'Becoming', '2026-10-07', '']
].map((r) => ({ member: r[0], book: r[1], loanDate: r[2], returnDate: r[3] }));

// ===== Data master: kategori, pengarang, penerbit (localStorage) =====
const CATEGORY_META = {
  'Fiction': ['Novels, fantasy & literary works', 'menu_book'],
  'Science & Tech': ['Computing, engineering & research', 'science'],
  'History': ['World history & civilizations', 'account_balance'],
  'Children': ['Picture books & young readers', 'child_care'],
  'Biography': ['Memoirs & life stories', 'person'],
  'Art & Design': ['Photography, art & creativity', 'palette']
};
const DEFAULT_CATEGORIES = CATEGORIES.map((c, i) => ({
  id: i + 1, name: c.name, color: c.color, description: CATEGORY_META[c.name][0], icon: CATEGORY_META[c.name][1]
}));

const AUTHOR_INFO = {
  'James Clear': ['American', 'Verified'], 'Matt Haig': ['British', 'Verified'], 'Frank Herbert': ['American', 'Verified'],
  'Yuval Noah Harari': ['Israeli', 'Verified'], 'Robert C. Martin': ['American', 'Verified'], 'Tara Westover': ['American', 'Verified'],
  'J.R.R. Tolkien': ['British', 'Verified'], 'Carl Sagan': ['American', 'Verified'], 'Jared Diamond': ['American', 'Verified'],
  'Maurice Sendak': ['American', 'Pending'], 'Roald Dahl': ['British', 'Verified'], 'Walter Isaacson': ['American', 'Verified'],
  'E.H. Gombrich': ['Austrian', 'Verified'], 'Michelle Obama': ['American', 'Verified'], 'Don Norman': ['American', 'Pending'],
  'E.B. White': ['American', 'Verified'], 'Aldous Huxley': ['British', 'Verified'], 'Stephen Hawking': ['British', 'Verified'],
  'Trevor Noah': ['South African', 'Verified']
};
const DEFAULT_AUTHORS = Object.entries(AUTHOR_INFO).map(([name, [nationality, status]], i) => ({
  id: i + 1, name, nationality, status, biography: ''
}));

const DEFAULT_PUBLISHERS = [
  ['Gramedia Pustaka', 'Jakarta', 'Indonesia', 'info@gramedia-pustaka.example', '+62 21 5550 0101', 312],
  ['Penguin Random', 'New York', 'United States', 'contact@penguin-random.example', '+1 212 555 0102', 428],
  ['HarperCollins', 'London', 'United Kingdom', 'hello@harpercollins.example', '+44 20 5550 0103', 265],
  ['Oxford Press', 'Oxford', 'United Kingdom', 'press@oxford-press.example', '+44 1865 555 0104', 198],
  ['Scholastic', 'New York', 'United States', 'info@scholastic.example', '+1 212 555 0105', 154],
  ['Mizan Media', 'Bandung', 'Indonesia', 'redaksi@mizan-media.example', '+62 22 5550 0106', 121]
].map((p, i) => ({ id: i + 1, name: p[0], city: p[1], country: p[2], email: p[3], phone: p[4], titles: p[5], address: '' }));

function loadList(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(saved)) return saved;
  } catch (e) { /* pakai data bawaan */ }
  return fallback.map((x) => ({ ...x }));
}
const getCategories = () => loadList('elib_categories', DEFAULT_CATEGORIES);
const saveCategories = (l) => localStorage.setItem('elib_categories', JSON.stringify(l));
const getAuthors = () => loadList('elib_authors', DEFAULT_AUTHORS);
const saveAuthors = (l) => localStorage.setItem('elib_authors', JSON.stringify(l));
const getPublishers = () => loadList('elib_publishers', DEFAULT_PUBLISHERS);
const savePublishers = (l) => localStorage.setItem('elib_publishers', JSON.stringify(l));

// ===== Data koleksi digital / e-book (localStorage) =====
const EBOOK_CATEGORIES = ['Self Growth', 'History', 'Technology', 'Biography', 'Fiction', 'Science'];
const EBOOK_COVER_COLORS = ['#00897B', '#3F51B5', '#F57C00', '#388E3C', '#546E7A', '#00796B', '#8E24AA', '#D81B60', '#0288D1', '#6D4C41'];
const EBOOK_STORAGE_LIMIT_MB = 10 * 1024;
const EBOOK_STORAGE_USED_MB = 4300;   // total awal penyimpanan terpakai (simulasi, 4.2 GB)
const EBOOK_OTHER_TOTAL = 308;        // e-book lain di server yang tidak ada di daftar mock ini (total awal 320)
const EBOOK_MONTH_BASE = 1840;        // unduhan bulan ini (simulasi)
const EBOOK_MONTH_KEY = 'elib_ebook_month_extra';

const DEFAULT_EBOOKS = [
  ['Atomic Habits', '978-0525559474', 'James Clear', 'Self Growth', 'EPUB', 4.8, 428, '2026-09-28', 0],
  ['Sapiens', '978-0062316097', 'Yuval Noah Harari', 'History', 'PDF', 12.4, 365, '2026-09-24', 1],
  ['Clean Code', '978-0132350884', 'Robert C. Martin', 'Technology', 'PDF', 8.7, 312, '2026-09-20', 2],
  ['Educated', '978-0399590504', 'Tara Westover', 'Biography', 'EPUB', 5.1, 284, '2026-09-17', 3],
  ['The Midnight Library', '978-0735211292', 'Matt Haig', 'Fiction', 'EPUB', 3.9, 251, '2026-09-14', 4],
  ['Dune', '978-0441172719', 'Frank Herbert', 'Fiction', 'PDF', 10.2, 219, '2026-09-10', 5],
  ['Cosmos', '978-0345539434', 'Carl Sagan', 'Science', 'PDF', 14.6, 198, '2026-09-06', 6],
  ['Steve Jobs', '978-1451648539', 'Walter Isaacson', 'Biography', 'EPUB', 6.3, 176, '2026-09-03', 7],
  ['Homo Deus', '978-0062464316', 'Yuval Noah Harari', 'History', 'EPUB', 5.7, 162, '2026-08-29', 8],
  ['A Brief History of Time', '978-0553380163', 'Stephen Hawking', 'Science', 'PDF', 7.9, 141, '2026-08-25', 9],
  ['Deep Work', '978-1455586691', 'Cal Newport', 'Self Growth', 'EPUB', 4.2, 133, '2026-08-20', 0],
  ['Brave New World', '978-0060850524', 'Aldous Huxley', 'Fiction', 'EPUB', 3.2, 97, '2026-08-14', 1]
].map((b, i) => ({
  id: i + 1, title: b[0], isbn: b[1], author: b[2], category: b[3], format: b[4], size: b[5],
  downloads: b[6], uploaded: b[7], color: EBOOK_COVER_COLORS[b[8]],
  fileName: `${b[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.${b[4].toLowerCase()}`
}));

const getEbooks = () => loadList('elib_ebooks', DEFAULT_EBOOKS);
const saveEbooks = (l) => localStorage.setItem('elib_ebooks', JSON.stringify(l));