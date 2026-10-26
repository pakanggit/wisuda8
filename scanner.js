const API_URL = "https://script.google.com/macros/s/AKfycbzZ0S0toOti6oVf9x-p5jlDP-G-wVlj0y05QrCqfTzoGRYMeS5ENBj9TMflfpvtdnO9/exec";

let isProcessing = false;

function onScanSuccess(decodedText) {
  if (isProcessing) return; 
  isProcessing = true;

  document.getElementById('loading').classList.remove('hidden');

  // 1. Decode URL jika QR membaca format link QuickChart yang ter-encode (%3A, %7C, dll)
  let textToProcess = decodedText;
  try {
    textToProcess = decodeURIComponent(decodedText);
  } catch (e) {
    // Jika teks biasa, biarkan apa adanya
  }

  // 2. Ekstrak ID dari format "ID: VIP-001 | Nama: ... | Kategori: ..."
  let cleanId = textToProcess;
  if (textToProcess.includes('|')) {
    cleanId = textToProcess.split('|')[0].replace('ID:', '').trim();
  } else {
    cleanId = textToProcess.trim();
  }

  // Debugging di Console Browser (tekan F12 untuk melihat hasil pembersihan ID)
  console.log("Raw QR:", decodedText);
  console.log("Clean ID yang dikirim ke server:", cleanId);

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
