const API_URL = "https://script.google.com/macros/s/AKfycbyrNdu6cavieDTP9qTlJ7WO24caKVKrPxWzLFzbYvFIH-I03Mf0M-mTnjunj6xYiaUx/exec";

let isProcessing = false;

function onScanSuccess(decodedText) {
  if (isProcessing) return; 
  isProcessing = true;

  document.getElementById('loading').classList.remove('hidden');

  // Membersihkan teks QR jika formatnya gabungan ("ID: ... | Nama: ... | Kategori: ...")
  let cleanId = decodedText;
  if (decodedText.includes('|')) {
    cleanId = decodedText.split('|')[0].replace('ID:', '').trim();
  }

  // Menggunakan method POST tanpa mode no-cors agar pesan dari Apps Script tertangkap
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ id: cleanId })
  })
  .then(response => response.json())
  .then(result => {
    document.getElementById('loading').classList.add('hidden');
    
    if (result.status === 'success') {
      Swal.fire({
        icon: 'success',
        title: 'Presensi Berhasil!',
        text: `${result.nama} (${result.kategori}) tercatat hadir pada pukul ${result.waktu}.`,
        timer: 2000,
        showConfirmButton: false
      });
    } else if (result.status === 'already_present') {
      Swal.fire({
        icon: 'info',
        title: 'Sudah Hadir!',
        text: `${result.nama} sudah melakukan presensi sebelumnya.`,
        timer: 2500,
        showConfirmButton: false
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: result.message || 'ID Undangan tidak terdaftar!'
      });
    }
    isProcessing = false;
  })
  .catch(err => {
    console.error("Error:", err);
    document.getElementById('loading').classList.add('hidden');
    Swal.fire({
      icon: 'error',
      title: 'Koneksi Gagal',
      text: 'Gagal terhubung ke server database.'
    });
    isProcessing = false;
  });
}

// Inisialisasi Kamera dengan HTML5 QR Code Scanner
const html5QrcodeScanner = new Html5QrcodeScanner(
  "reader", 
  { fps: 10, qrbox: { width: 250, height: 250 } },
  false
);

html5QrcodeScanner.render(onScanSuccess);
