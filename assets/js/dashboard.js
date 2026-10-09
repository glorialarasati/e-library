const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const fmt = (n) => n.toLocaleString('en-US');

// Sapaan dan tanggal
document.getElementById('todayDate').textContent =
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: '2-digit', year: 'numeric' });

// Line chart: statistik peminjaman
const loanChart = new Chart(document.getElementById('loanChart'), {
  type: 'line',
  data: {
    labels: MONTHS,
    datasets: [
      { label: 'Loans', data: LOANS_PER_MONTH, borderColor: '#3F51B5', backgroundColor: 'rgba(63,81,181,.12)',
        fill: true, tension: 0.4, pointBackgroundColor: '#fff', pointBorderWidth: 2 },
      { label: 'Returns', data: RETURNS_PER_MONTH, borderColor: '#FFB300', borderDash: [6, 4],
        tension: 0.4, pointBackgroundColor: '#fff', pointBorderWidth: 2 }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { color: '#EEEEEE' } }, x: { grid: { display: false } } }
  }
});

function setPeriod(n) {
  loanChart.data.labels = MONTHS.slice(-n);
  loanChart.data.datasets[0].data = LOANS_PER_MONTH.slice(-n);
  loanChart.data.datasets[1].data = RETURNS_PER_MONTH.slice(-n);
  loanChart.update();
  document.getElementById('totalLoans').textContent = fmt(sum(LOANS_PER_MONTH.slice(-n)));
  document.getElementById('totalReturns').textContent = fmt(sum(RETURNS_PER_MONTH.slice(-n)));
}
setPeriod(6);

document.getElementById('period').addEventListener('change', (e) => setPeriod(Number(e.target.value)));

// Tombol Loans / Returns: tampilkan atau sembunyikan garis
document.querySelectorAll('.series-toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const i = Number(btn.dataset.series);
    const visible = loanChart.isDatasetVisible(i);
    loanChart.setDatasetVisibility(i, !visible);
    btn.setAttribute('aria-pressed', !visible);
    loanChart.update();
  });
});

// Donut chart: buku per kategori
const totalBooks = sum(CATEGORIES.map((c) => c.count));
new Chart(document.getElementById('categoryChart'), {
  type: 'doughnut',
  data: {
    labels: CATEGORIES.map((c) => c.name),
    datasets: [{ data: CATEGORIES.map((c) => c.count), backgroundColor: CATEGORIES.map((c) => c.color), borderWidth: 2 }]
  },
  options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false } } },
  plugins: [{
    id: 'centerText',
    afterDraw(chart) {
      const { ctx, chartArea: { left, right, top, bottom } } = chart;
      const x = (left + right) / 2;
      const y = (top + bottom) / 2;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1C1B1F';
      ctx.font = '700 22px Roboto';
      ctx.fillText(fmt(totalBooks), x, y + 4);
      ctx.fillStyle = '#757575';
      ctx.font = '11px Roboto';
      ctx.fillText('Total Titles', x, y + 20);
      ctx.restore();
    }
  }]
});

document.getElementById('categoryLegend').innerHTML = CATEGORIES.map((c) => `
  <li><span class="dot-color" style="background:${c.color}"></span>${c.name}
  <strong>${c.count}</strong><span class="pct">${Math.round((c.count / totalBooks) * 100)}%</span></li>`).join('');

// Tabel peminjaman terbaru
document.getElementById('recentLoans').innerHTML = RECENT_LOANS.map((l) => `
  <tr>
    <td>${l.member}</td><td>${l.book}</td><td>${l.loanDate}</td><td>${l.dueDate}</td>
    <td><span class="chip chip-${l.status.toLowerCase()}">${l.status}</span></td>
  </tr>`).join('');

document.getElementById('exportBtn').addEventListener('click', () => window.print());