const API_URL = "https://script.google.com/macros/s/AKfycbyXHxM0GMMWyiVo_GuIboCWApkt98GdcCdwkh7yoNrnf5GwfOwOgyYiuTjrGRYxssAd/exec";

let chartInstance = null;
let shownVipGuests = new Set(); 
let vipQueue = [];              
let isModalActive = false;      
let modalTimeout = null;

async function fetchStats() {
  try {
    const response = await fetch(`${API_URL}?action=getStats`);
    const data = await response.json();

    if (data.status === 'success') {
      updateCards(data.vip, data.reguler);
      updateChart(data.vip, data.reguler);
      updateLogs(data.logs);
      checkVipArrivals(data.logs); 
    }
  } catch (err) {
    console.error("Gagal mengambil data:", err);
  }
}

function updateCards(vip, reg) {
  document.getElementById('totalVip').textContent = vip.total;
  document.getElementById('hadirVip').textContent = vip.hadir;
  document.getElementById('totalReg').textContent = reg.total;
  document.getElementById('hadirReg').textContent = reg.hadir;
}

function updateChart(vip, reg) {
  const ctx = document.getElementById('presenceChart').getContext('2d');

  const totalTamu = vip.total + reg.total;
  const totalHadir = vip.hadir + reg.hadir;
  const belumHadir = Math.max(0, totalTamu - totalHadir);

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Hadir', 'Belum Hadir'],
      datasets: [{
        data: [totalHadir, belumHadir],
        backgroundColor: ['#10b981', '#334155'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8' } }
      }
    }
  });
}

function updateLogs(logs) {
  const container = document.getElementById('logsContainer');
  if (!logs || logs.length === 0) {
    container.innerHTML = `<p class="text-slate-500 text-center py-8">Belum ada tamu yang hadir.</p>`;
    return;
  }

  container.innerHTML = logs.map(log => {
    const isVip = log.kategori === 'VIP';
    const badgeColor = isVip 
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';

    return `
      <div class="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center ${isVip ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}">
            <i class="fa-solid ${isVip ? 'fa-crown' : 'fa-user'}"></i>
          </div>
          <div>
            <h4 class="font-bold text-slate-100">${log.nama}</h4>
            <span class="text-xs px-2 py-0.5 rounded-md border ${badgeColor}">${log.kategori}</span>
          </div>
        </div>
        <span class="text-xs text-slate-400 font-mono">${log.waktu}</span>
      </div>
    `;
  }).join('');
}

// --- LOGIKA POP-UP SAMBUTAN VIP & STATUS GLOBAL ---

function checkVipArrivals(logs) {
  if (!logs) return;
  const vipLogs = logs.filter(log => log.kategori === 'VIP').reverse();

  vipLogs.forEach(vip => {
    // Masukkan ke antrean HANYA JIKA di spreadsheet statusPopup-nya belum 'Sudah'
    if (vip.statusPopup !== 'Sudah' && !shownVipGuests.has(vip.nama)) {
      const existingInQueue = vipQueue.some(item => item.nama === vip.nama);
      if (!existingInQueue) {
        vipQueue.push({ 
          nama: vip.nama, 
          jabatan: vip.jabatan || 'Tamu Kehormatan Wisuda' 
        });
      }
    }
  });
  processVipQueue();
}

async function processVipQueue() {
  if (isModalActive || vipQueue.length === 0) return;

  const nextVip = vipQueue.shift(); 
  shownVipGuests.add(nextVip.nama);

  // Tampilkan pop-up
  showVipModal(nextVip.nama, nextVip.jabatan);

  // Kirim status 'Sudah' ke Google Sheets agar tersimpan secara global
  try {
    await fetch(`${API_URL}?action=markShown&nama=${encodeURIComponent(nextVip.nama)}`);
  } catch (err) {
    console.error("Gagal memperbarui status pop-up ke server:", err);
  }
}

function showVipModal(nama, jabatan) {
  isModalActive = true;
  document.getElementById('vipGuestName').textContent = nama;
  document.getElementById('vipJabatan').textContent = jabatan; 
  document.getElementById('vipModal').classList.remove('hidden');

  const DURATION_MS = 30 * 1000; // Durasi 30 detik

  modalTimeout = setTimeout(() => {
    closeVipModal();
  }, DURATION_MS);
}

function closeVipModal() {
  clearTimeout(modalTimeout);
  document.getElementById('vipModal').classList.add('hidden');
  isModalActive = false;

  setTimeout(processVipQueue, 1000);
}

// Auto-refresh data tiap 5 detik
fetchStats();
setInterval(fetchStats, 5000);
