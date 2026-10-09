<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reports | E-Library Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet">
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>

  <aside class="sidebar" id="sidebar" aria-label="Main navigation">
    <div class="brand">
      <div class="brand-logo"><span class="material-symbols-outlined" aria-hidden="true">menu_book</span></div>
      <div><strong>E-Library Admin</strong><small>DIGITAL LIBRARY SYSTEM</small></div>
    </div>

    <nav class="menu">
      <p class="menu-label">MAIN MENU</p>
      <a href="dashboard.html"><span class="material-symbols-outlined" aria-hidden="true">dashboard</span>Dashboard</a>

      <p class="menu-label">DATA MASTER</p>
      <button class="dropdown-btn" aria-expanded="false">
        <span class="material-symbols-outlined" aria-hidden="true">database</span>Data Master
        <span class="material-symbols-outlined chevron" aria-hidden="true">expand_more</span>
      </button>
      <ul class="submenu">
        <li><a href="data-master.html"><span class="material-symbols-outlined" aria-hidden="true">book</span>Books<span class="badge">1,250</span></a></li>
        <li><a href="categories.html"><span class="material-symbols-outlined" aria-hidden="true">category</span>Categories</a></li>
        <li><a href="authors.html"><span class="material-symbols-outlined" aria-hidden="true">edit_note</span>Authors</a></li>
        <li><a href="publishers.html"><span class="material-symbols-outlined" aria-hidden="true">apartment</span>Publishers</a></li>
      </ul>
      <a href="membership.html"><span class="material-symbols-outlined" aria-hidden="true">group</span>Membership<span class="badge">342</span></a>

      <p class="menu-label">CIRCULATION</p>
      <button class="dropdown-btn" aria-expanded="false">
        <span class="material-symbols-outlined" aria-hidden="true">sync</span>Circulation
        <span class="material-symbols-outlined chevron" aria-hidden="true">expand_more</span>
      </button>
      <ul class="submenu">
        <li><a href="loans.html"><span class="material-symbols-outlined" aria-hidden="true">assignment</span>Loans<span class="badge">87</span></a></li>
        <li><a href="returns.html"><span class="material-symbols-outlined" aria-hidden="true">keyboard_return</span>Returns</a></li>
        <li><a href="reservations.html"><span class="material-symbols-outlined" aria-hidden="true">bookmark</span>Reservations<span class="badge">18</span></a></li>
        <li><a href="penalties.html"><span class="material-symbols-outlined" aria-hidden="true">payments</span>Penalties</a></li>
      </ul>

      <p class="menu-label">LIBRARY</p>
      <a href="digital-collection.html"><span class="material-symbols-outlined" aria-hidden="true">collections_bookmark</span>Digital Collection</a>
      <a href="laporan.html"><span class="material-symbols-outlined" aria-hidden="true">bar_chart</span>Reports</a>
      <a href="settings.html"><span class="material-symbols-outlined" aria-hidden="true">settings</span>Settings</a>
    </nav>

    <div class="profile-card">
      <div class="avatar">AH</div>
      <div><strong>Amelia Hart</strong><small>Super Admin</small></div>
      <a class="icon-btn" href="../index.html" aria-label="Log out"><span class="material-symbols-outlined" aria-hidden="true">logout</span></a>
    </div>
  </aside>

  <div class="overlay" id="overlay"></div>

  <div class="main-wrap">
    <header class="header">
      <button class="icon-btn" id="menuToggle" aria-label="Toggle sidebar"><span class="material-symbols-outlined" aria-hidden="true">menu</span></button>
      <div class="page-title"><strong>Reports &amp; Statistics</strong><small>Circulation and member metrics</small></div>

      <label class="search">
        <span class="material-symbols-outlined" aria-hidden="true">search</span>
        <input type="search" id="searchInput" placeholder="Search books, members, ISBN..." aria-label="Search">
        <kbd>Ctrl K</kbd>
      </label>

      <div class="header-right">
        <div class="clock"><strong id="clockTime"></strong><span id="clockDate"></span></div>
        <button class="icon-btn" aria-label="Help"><span class="material-symbols-outlined" aria-hidden="true">help</span></button>
        <button class="icon-btn" aria-label="Notifications"><span class="material-symbols-outlined" aria-hidden="true">notifications</span><span class="dot">4</span></button>
        <div class="user">
          <div class="avatar">AH</div>
          <div><strong>Amelia Hart</strong><small>Administrator</small></div>
        </div>
      </div>
    </header>

    <main class="content">
      <nav class="breadcrumb no-print" aria-label="Breadcrumb">Library / <strong>Reports</strong></nav>

      <div class="page-head no-print">
        <div><h1>Loan Report</h1><p>Filter circulation records, then print or export them.</p></div>
        <div class="actions">
          <button class="btn" id="printBtn"><span class="material-symbols-outlined" aria-hidden="true">print</span>Print</button>
          <button class="btn btn-primary" id="pdfBtn"><span class="material-symbols-outlined" aria-hidden="true">picture_as_pdf</span>Export PDF</button>
        </div>
      </div>

      <section class="card no-print" aria-label="Report filters" style="margin-bottom:16px">
        <form class="filter-form" id="filterForm" novalidate>
          <div class="field"><label for="fromDate">From Date</label><input type="date" id="fromDate" aria-describedby="dateError"></div>
          <div class="field"><label for="toDate">To Date</label><input type="date" id="toDate"></div>
          <div class="field">
            <label for="reportType">Report Type</label>
            <select id="reportType">
              <option value="all">All loans</option><option value="returned">Returned</option>
              <option value="borrowed">Currently borrowed</option><option value="overdue">Overdue</option>
              <option value="fines">With fines</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary" style="height:40px">Show</button>
          <p class="error" id="dateError" role="alert"></p>
        </form>
      </section>

      <section class="card" id="report" aria-labelledby="reportTitle">
        <header class="report-head">
          <h2 id="reportTitle">Library Loan Report</h2>
          <p id="reportMeta"></p>
        </header>

        <div class="stats three">
          <article class="stat"><div class="stat-top"><span class="stat-icon"><span class="material-symbols-outlined" aria-hidden="true">assignment</span></span></div>
            <p class="stat-num" id="totalLoans">0</p><p class="stat-label">Total Loans</p></article>
          <article class="stat tone-green"><div class="stat-top"><span class="stat-icon"><span class="material-symbols-outlined" aria-hidden="true">keyboard_return</span></span></div>
            <p class="stat-num" id="totalReturns">0</p><p class="stat-label">Total Returns</p></article>
          <article class="stat stat-alert"><div class="stat-top"><span class="stat-icon"><span class="material-symbols-outlined" aria-hidden="true">payments</span></span></div>
            <p class="stat-num" id="totalFines">Rp 0</p><p class="stat-label">Total Fines</p></article>
        </div>

        <div class="table-wrap">
          <table>
            <thead><tr><th>No</th><th>Date</th><th>Member Name</th><th>Book Title</th><th>Return Date</th><th>Fine</th><th>Status</th></tr></thead>
            <tbody id="reportBody"></tbody>
          </table>
        </div>
      </section>
    </main>

    <footer class="footer">&copy; 2026 E-Library Admin. All rights reserved.</footer>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
  <script src="../assets/js/layout.js"></script>
  <script src="../assets/js/data.js"></script>
  <script src="../assets/js/report.js"></script>
</body>
</html>