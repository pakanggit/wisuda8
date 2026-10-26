const API_URL = "https://script.google.com/macros/s/AKfycbwf6rHJY8qLGqEA2S4IfAREep3BdXj5sP0gLB9aOiaBk5pcaB0ikjZe3UcWlPH7V7Ti/exec";

let isProcessing = false;

function onScanSuccess(decodedText) {
  if (isProcessing) return; // Mencegah multiple trigger bersamaan dari scanner
  isProcessing = true;

  document.getElementById('loading').classList.remove('hidden');

  fetch(API_URL, {
    method: 'POST',
    mode: 'no-cors', // Menghindari CORS issue saat POST ke Apps Script
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: decodedText })
  })
  .then(() => {
    // Karena mode no-cors tidak bisa membaca JSON response secara langsung,
    // Kita lakukan verifikasi ulang via GET/re-check atau gunakan alert sukses universal.
    Swal.fire({
      icon: 'success',
      title: 'Presensi Terproses!',
      text: `ID Undangan: ${decodedText}`,
      timer: 2000,
      showConfirmButton: false
    }).then(() => {
      isProcessing = false;
      document.getElementById('loading').classList.add('hidden');
    });
  })
  .catch(err => {
    Swal.fire({
      icon: 'error',
      title: 'Gagal',
      text: 'Terjadi kesalahan sistem.'
    }).then(() => {
      isProcessing = false;
      document.getElementById('loading').classList.add('hidden');
    });
  });
}

// Inisialisasi Kamera dengan HTML5 QR Code Scanner
const html5QrcodeScanner = new Html5QrcodeScanner(
  "reader", 
  { fps: 10, qrbox: { width: 250, height: 250 } },
  /* verbose= */ false
);

html5QrcodeScanner.render(onScanSuccess);
