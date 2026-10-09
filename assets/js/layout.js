// Proteksi halaman: harus login dulu (simulasi sisi klien)
if (!sessionStorage.getItem('elib_auth')) location.replace('../index.html');

const body = document.body;

// Toggle sidebar: drawer di mobile, sembunyikan/tampilkan di desktop
document.getElementById('menuToggle').addEventListener('click', () => {
  body.classList.toggle(window.innerWidth < 768 ? 'sidebar-open' : 'sidebar-collapsed');
});
document.getElementById('overlay').addEventListener('click', () => body.classList.remove('sidebar-open'));

// Dropdown menu (Data Master, Circulation)
document.querySelectorAll('.dropdown-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const open = btn.nextElementSibling.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
});

// Tandai menu aktif berdasarkan nama file; default ke Dashboard
const links = [...document.querySelectorAll('.menu a')];
const here = body.dataset.menu || location.pathname.split('/').pop();
const current = links.find((a) => a.getAttribute('href') === here) || links[0];
current.classList.add('active');
const submenu = current.closest('.submenu');
if (submenu) {
  submenu.classList.add('open');
  submenu.previousElementSibling.setAttribute('aria-expanded', true);
}

// Shortcut: Ctrl+K fokus ke pencarian, Esc menutup drawer
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    document.getElementById('searchInput').focus();
  }
  if (e.key === 'Escape') body.classList.remove('sidebar-open');
});

// Jam dan tanggal di header
function tick() {
  const now = new Date();
  document.getElementById('clockTime').textContent =
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('clockDate').textContent =
    now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: '2-digit', year: 'numeric' });
}
tick();
setInterval(tick, 30000);

// Snackbar notifikasi (dipakai semua halaman)
function showToast(message) {
  let bar = document.getElementById('snackbar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'snackbar';
    bar.className = 'snackbar';
    bar.setAttribute('role', 'status');
    document.body.appendChild(bar);
  }
  bar.textContent = message;
  bar.classList.add('show');
  clearTimeout(bar.timer);
  bar.timer = setTimeout(() => bar.classList.remove('show'), 3000);
}

// Logout: hapus sesi lalu kembali ke halaman login
document.querySelector('[aria-label="Log out"]').addEventListener('click', () => sessionStorage.removeItem('elib_auth'));