// Konfigurasi 4 Lokasi Sah (Ganti koordinat sesuai lokasi asli AFJ)
const authorizedLocations = [
  { name: "Kantor Pusat", lat: -6.2, lon: 106.816666 },
  { name: "Gudang A", lat: -6.21, lon: 106.82 },
  { name: "Gudang B", lat: -6.22, lon: 106.83 },
  { name: "Toko Cabang", lat: -6.23, lon: 106.84 },
];

const maxDistance = 300; // Radius toleransi 300 meter
let attendanceStatus = "";
let detectedLocation = "";
const urlWebhook = "URL_DEPLOYMENT_GOOGLE_ANDA";

const statusDiv = document.getElementById("status");
const absentBtn = document.getElementById("absentBtn");
const message = document.getElementById("message");

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(checkLocation, handleError, {
    enableHighAccuracy: true,
  });
} else {
  statusDiv.innerHTML = "Browser tidak mendukung GPS.";
}

function checkLocation(position) {
  const userLat = position.coords.latitude;
  const userLon = position.coords.longitude;

  let isInside = false;
  let minDistanceFound = Infinity;

  for (let loc of authorizedLocations) {
    const distance = calculateDistance(userLat, userLon, loc.lat, loc.lon);
    if (distance < minDistanceFound) minDistanceFound = distance;

    if (distance <= maxDistance) {
      isInside = true;
      detectedLocation = loc.name;
      break;
    }
  }

  if (isInside) {
    attendanceStatus = "SAH";
    statusDiv.innerHTML = `✅ Lokasi: <strong>${detectedLocation}</strong>`;
  } else {
    attendanceStatus = "DILUAR RADIUS";
    statusDiv.innerHTML = `⚠️ Jarak: ${Math.round(minDistanceFound)}m dari lokasi sah.`;
  }
  absentBtn.disabled = false;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

absentBtn.addEventListener("click", async () => {
  const employeeId = prompt("Masukkan Nama atau ID Karyawan:");
  if (!employeeId) return;

  message.innerHTML = "Sedang mengirim data...";

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const payload = {
      employeeId: employeeId,
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      accuracy: Math.round(pos.coords.accuracy),
      status: attendanceStatus,
      officeName: attendanceStatus === "SAH" ? detectedLocation : "Luar Area",
    };

    try {
      await fetch(urlWebhook, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload),
      });
      message.innerHTML = `✅ Absen Berhasil! Status: ${attendanceStatus}`;
    } catch (e) {
      message.innerHTML = "❌ Gagal mengirim. Cek koneksi.";
    }
  });
});

function handleError(error) {
  statusDiv.innerHTML = "Gagal mengambil GPS. Pastikan Izin Lokasi aktif.";
}
