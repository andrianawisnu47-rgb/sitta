/**
 * script.js — SITTA
 * Script terpusat untuk semua halaman: login, dashboard, tracking, stok.
 * Untuk produksi: ganti fungsi simulasi dengan fetch() ke REST API.
 */

/* ══════════════════════════════════════════════════════
   1. LOADING SCREEN
   Dipanggil otomatis saat halaman selesai dimuat.
══════════════════════════════════════════════════════ */
function _bootPage() {
  // Loading screen
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.5s ease';
      setTimeout(() => loader.style.display = 'none', 500);
    }, 1000);
  }
  // Deteksi halaman aktif
  const page = document.body.dataset.page;
  if (page === 'dashboard') initDashboard();
  if (page === 'tracking')  initTracking();
  if (page === 'stok')      initStok();
  if (page === 'login')     initLogin();
}

// Script diletakkan di akhir <body> -> DOM sudah siap saat baris ini berjalan.
// readyState check memastikan tetap works jika script dipindah ke <head>.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _bootPage);
} else {
  _bootPage();
}


/* ══════════════════════════════════════════════════════
   2. LIVE CLOCK — dipakai di semua halaman
══════════════════════════════════════════════════════ */
function startClock() {
  const el = document.getElementById('liveClock');
  if (!el) return;
  function tick() {
    const now = new Date();
    el.textContent = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(v => String(v).padStart(2, '0')).join(':');
  }
  tick();
  setInterval(tick, 1000);
}


/* ══════════════════════════════════════════════════════
   3. LOGIN
══════════════════════════════════════════════════════ */
const VALID_USERS = [
  { email: 'admin@ut.id',   pass: 'admin123', nama: 'Admin',         role: 'Administrator' },
  { email: 'staf@ut.id',    pass: 'staf123',  nama: 'Staf Gudang',   role: 'Staf'          },
  { email: 'manajer@ut.id', pass: 'mgr123',   nama: 'Budi Santoso',  role: 'Manajer'       },
];

function initLogin() {
  // Enter key di field password
  const passEl = document.getElementById('password');
  if (passEl) passEl.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  const emailEl = document.getElementById('email');
  if (emailEl) emailEl.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });

  // Isi demo credentials hint
  const hintEl = document.getElementById('loginHint');
  if (hintEl) hintEl.textContent = 'Demo: admin@ut.id / admin123';
}

function handleLogin() {
  const emailEl = document.getElementById('email');
  const passEl  = document.getElementById('password');
  const errEl   = document.getElementById('loginError');
  const btn     = document.getElementById('loginBtn');

  if (!emailEl || !passEl) return;

  const email = emailEl.value.trim();
  const pass  = passEl.value;

  // Kosong?
  if (!email || !pass) {
    showLoginError(errEl, 'Email dan password wajib diisi.');
    return;
  }

  // Loading state
  if (btn) { btn.disabled = true; btn.textContent = 'Memeriksa…'; }

  setTimeout(() => {
    const user = VALID_USERS.find(u => u.email === email && u.pass === pass);
    if (user) {
      // Simpan ke sessionStorage + localStorage agar tidak hilang saat refresh
      const payload = JSON.stringify({ nama: user.nama, role: user.role, email: user.email });
      sessionStorage.setItem('sitta_user', payload);
      localStorage.setItem('sitta_user', payload);
      window.location.href = 'dashboard.html';
    } else {
      if (btn) { btn.disabled = false; btn.textContent = 'Masuk'; }
      showLoginError(errEl, 'Email atau password salah. Silakan coba lagi.');
      passEl.value = '';
      passEl.focus();
    }
  }, 700); // simulasi network
}

function showLoginError(el, msg) {
  if (!el) { alert(msg); return; }
  el.textContent = msg;
  el.style.display = 'flex';
  el.style.animation = 'none';
  requestAnimationFrame(() => { el.style.animation = ''; });
}

function togglePassword() {
  const passEl = document.getElementById('password');
  const eyeEl  = document.getElementById('eyeIcon');
  if (!passEl) return;
  if (passEl.type === 'password') {
    passEl.type = 'text';
    if (eyeEl) eyeEl.textContent = '🙈';
  } else {
    passEl.type = 'password';
    if (eyeEl) eyeEl.textContent = '👁️';
  }
}


/* ══════════════════════════════════════════════════════
   4. SESSION — cek login & ambil user
══════════════════════════════════════════════════════ */
function getSession() {
  try {
    // Coba sessionStorage dulu, fallback ke localStorage
    return JSON.parse(sessionStorage.getItem('sitta_user'))
        || JSON.parse(localStorage.getItem('sitta_user'))
        || null;
  } catch { return null; }
}

function requireLogin() {
  const user = getSession();
  if (!user) {
    // Hanya redirect jika bukan sedang di login.html
    if (!window.location.pathname.includes('login')) {
      window.location.href = 'login.html';
    }
    return null;
  }
  return user;
}

function logout() {
  sessionStorage.removeItem('sitta_user');
  localStorage.removeItem('sitta_user');
  window.location.href = 'login.html';
}

function applyUserUI(user) {
  if (!user) return;
  // Avatar inisial
  document.querySelectorAll('.avatar').forEach(el => {
    const parts = user.nama.split(' ');
    el.textContent = parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : user.nama.slice(0, 2).toUpperCase();
  });
  // Nama di greeting
  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = user.nama;
  // Role chip
  const roleEl = document.getElementById('userRole');
  if (roleEl) roleEl.textContent = user.role;
}


/* ══════════════════════════════════════════════════════
   5. DASHBOARD
══════════════════════════════════════════════════════ */
function initDashboard() {
  const user = requireLogin() || { nama: 'Admin', role: 'Administrator', email: '' };
  startClock();
  applyUserUI(user);
  updateGreeting();
  updateDate();
  setInterval(updateGreeting, 60000);
}

function updateGreeting() {
  const hour  = new Date().getHours();
  const iconEl  = document.getElementById('greetIcon');
  const labelEl = document.getElementById('greetLabel');
  const subEl   = document.getElementById('greetSub');
  if (!iconEl) return;

  const greet =
    hour >= 5  && hour < 11 ? { icon:'🌅', label:'Selamat Pagi',  sub:'Mulai hari dengan semangat! Ada banyak yang bisa dikerjakan hari ini.' } :
    hour >= 11 && hour < 15 ? { icon:'☀️', label:'Selamat Siang', sub:'Tetap semangat di tengah hari. Jangan lupa istirahat sejenak.' } :
    hour >= 15 && hour < 18 ? { icon:'🌤️', label:'Selamat Sore',  sub:'Sore yang produktif! Selesaikan tugasmu sebelum hari berakhir.' } :
                              { icon:'🌙', label:'Selamat Malam', sub:'Terima kasih atas kerja kerasmu hari ini. Selamat beristirahat.' };

  iconEl.textContent  = greet.icon;
  labelEl.textContent = greet.label;
  if (subEl) subEl.textContent = greet.sub;
}

function updateDate() {
  const el = document.getElementById('greetDate');
  if (!el) return;
  const now    = new Date();
  const days   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  el.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}


/* ══════════════════════════════════════════════════════
   6. TRACKING PENGIRIMAN
══════════════════════════════════════════════════════ */

// Data simulasi — ganti dengan fetch('/api/tracking?do=...') untuk produksi
const TRACKING_DATA = {
  "2024-0001": {
    nama: "Siti Rahayu Wulandari", nim: "044891234",
    program: "S1 Manajemen · UPBJJ Surabaya",
    status: "delivered", statusLabel: "Terkirim",
    do: "DO/2024/000001",
    kurir: "JNE Express", resi: "JNE2024112500089", layanan: "YES (Yakin Esok Sampai)",
    tglOrder: "22 Nov 2024", tglKirim: "23 Nov 2024", estTiba: "24 Nov 2024",
    jenis: "Bahan Ajar Cetak", jumlah: "6 Buku", berat: "2,4 kg",
    ongkir: "Rp 28.000", asuransi: "Rp 2.500", total: "Rp 30.500",
    penerima: "Siti Rahayu Wulandari", upbjj: "UPBJJ-UT Surabaya",
    alamat: "Jl. Raya Darmo No. 54, Wonokromo, Surabaya, Jawa Timur 60241",
    progressStep: 4,
    history: [
      { time:"24 Nov 2024 · 14:23", event:"Paket Diterima", loc:"Surabaya, Jawa Timur", color:"green" },
      { time:"24 Nov 2024 · 09:11", event:"Dalam Pengiriman ke Penerima", loc:"Pusat DC JNE Surabaya", color:"green" },
      { time:"23 Nov 2024 · 22:45", event:"Tiba di Gudang Transit", loc:"Hub JNE Surabaya", color:"green" },
      { time:"23 Nov 2024 · 16:00", event:"Berangkat dari Gudang Asal", loc:"Gudang UT Pusat, Tangerang", color:"green" },
      { time:"23 Nov 2024 · 09:30", event:"Paket Dijemput Kurir", loc:"Gudang UT Pusat, Tangerang", color:"green" },
      { time:"22 Nov 2024 · 15:00", event:"DO Dibuat & Diproses", loc:"Sistem SITTA", color:"green" },
    ]
  },
  "2024-0042": {
    nama: "Budi Santoso Prasetyo", nim: "041567890",
    program: "S1 Akuntansi · UPBJJ Bandung",
    status: "transit", statusLabel: "Dalam Perjalanan",
    do: "DO/2024/000042",
    kurir: "TIKI", resi: "TIKI20241203X00042", layanan: "ONS (Over Night Service)",
    tglOrder: "03 Des 2024", tglKirim: "04 Des 2024", estTiba: "05 Des 2024",
    jenis: "Bahan Ajar Cetak & Digital", jumlah: "4 Buku + 1 Flashdisk", berat: "1,8 kg",
    ongkir: "Rp 22.000", asuransi: "Rp 2.000", total: "Rp 24.000",
    penerima: "Budi Santoso Prasetyo", upbjj: "UPBJJ-UT Bandung",
    alamat: "Jl. Soekarno-Hatta No. 180, Bandung, Jawa Barat 40223",
    progressStep: 2,
    history: [
      { time:"04 Des 2024 · 20:15", event:"Dalam Perjalanan ke Bandung", loc:"Hub TIKI Jakarta Selatan", color:"orange" },
      { time:"04 Des 2024 · 14:30", event:"Tiba di Sortir Pusat", loc:"Gudang TIKI Jakarta", color:"green" },
      { time:"04 Des 2024 · 08:00", event:"Paket Dijemput Kurir", loc:"Gudang UT Pusat, Tangerang", color:"green" },
      { time:"03 Des 2024 · 16:00", event:"DO Dibuat & Diproses", loc:"Sistem SITTA", color:"green" },
    ]
  },
  "2024-0099": {
    nama: "Dwi Lestari Anggraeni", nim: "048234567",
    program: "S1 Ilmu Komunikasi · UPBJJ Yogyakarta",
    status: "pending", statusLabel: "Menunggu Pickup",
    do: "DO/2024/000099",
    kurir: "SiCepat", resi: "SC20241205000099", layanan: "REG (Reguler)",
    tglOrder: "05 Des 2024", tglKirim: "06 Des 2024", estTiba: "08 Des 2024",
    jenis: "Bahan Ajar Cetak", jumlah: "8 Buku", berat: "3,2 kg",
    ongkir: "Rp 18.000", asuransi: "Rp 2.000", total: "Rp 20.000",
    penerima: "Dwi Lestari Anggraeni", upbjj: "UPBJJ-UT Yogyakarta",
    alamat: "Jl. Colombo No. 1, Depok, Sleman, Yogyakarta 55281",
    progressStep: 0,
    history: [
      { time:"05 Des 2024 · 16:00", event:"DO Dibuat — Menunggu Pickup", loc:"Sistem SITTA", color:"gray" },
    ]
  },
  "2024-0120": {
    nama: "Ahmad Fauzan Hidayat", nim: "046789012",
    program: "S1 Hukum · UPBJJ Medan",
    status: "failed", statusLabel: "Gagal Kirim",
    do: "DO/2024/000120",
    kurir: "J&T Express", resi: "JT20241201000120", layanan: "EZ (Express)",
    tglOrder: "01 Des 2024", tglKirim: "02 Des 2024", estTiba: "04 Des 2024",
    jenis: "Bahan Ajar Cetak", jumlah: "5 Buku", berat: "2,0 kg",
    ongkir: "Rp 35.000", asuransi: "Rp 2.500", total: "Rp 37.500",
    penerima: "Ahmad Fauzan Hidayat", upbjj: "UPBJJ-UT Medan",
    alamat: "Jl. Universitas No. 9A, Medan Baru, Kota Medan, Sumatera Utara 20155",
    progressStep: 2,
    history: [
      { time:"04 Des 2024 · 13:00", event:"Gagal Dikirim — Alamat Tidak Ditemukan", loc:"Medan, Sumatera Utara", color:"orange" },
      { time:"04 Des 2024 · 07:30", event:"Kurir Menuju Lokasi", loc:"DC J&T Medan", color:"green" },
      { time:"03 Des 2024 · 23:00", event:"Tiba di Gudang Transit", loc:"Hub J&T Medan", color:"green" },
      { time:"02 Des 2024 · 15:00", event:"Berangkat dari Gudang Asal", loc:"Gudang UT Pusat, Tangerang", color:"green" },
      { time:"02 Des 2024 · 09:00", event:"Paket Dijemput Kurir", loc:"Gudang UT Pusat, Tangerang", color:"green" },
      { time:"01 Des 2024 · 16:00", event:"DO Dibuat & Diproses", loc:"Sistem SITTA", color:"green" },
    ]
  }
};

const TRACKING_STEPS = [
  { label:"DO Dibuat",      icon:"📝" },
  { label:"Dijemput Kurir", icon:"🏭" },
  { label:"Dalam Transit",  icon:"🚚" },
  { label:"Tiba di Tujuan", icon:"📍" },
  { label:"Diterima",       icon:"✅" },
];

const STATUS_STEP_MAP = { pending:0, transit:2, delivered:4, failed:2 };

function initTracking() {
  const user = requireLogin() || { nama: 'Admin', role: 'Administrator', email: '' };
  startClock();
  applyUserUI(user);
  const input = document.getElementById('doInput');
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });
}

// Dipanggil dari onclick chip contoh
function fillAndSearch(val) {
  const input = document.getElementById('doInput');
  if (input) input.value = val;
  handleSearch();
}

function handleSearch() {
  const input = document.getElementById('doInput');
  if (!input) return;
  const raw = input.value.trim();
  const key = raw.replace(/^DO[\/\s]?/i, '').trim();

  toggleEl('resultArea', false);
  toggleEl('notFound', false);
  toggleEl('loadingState', true);

  // Simulasi network delay — ganti dengan fetch() untuk produksi
  setTimeout(() => {
    toggleEl('loadingState', false);
    const d = TRACKING_DATA[key];
    if (!d) {
      setText('notFoundDO', raw || '(kosong)');
      toggleEl('notFound', true);
      return;
    }
    renderTrackingResult(d);
    toggleEl('resultArea', true);
    setTimeout(() => animateProgressBar(d), 120);
  }, 800);
}

function renderTrackingResult(d) {
  setText('rDO', d.do);
  setText('rName', d.nama);
  setText('rProgram', d.program);

  const statusClass = { delivered:'status-delivered', transit:'status-transit', pending:'status-pending', failed:'status-failed' };
  const el = document.getElementById('rStatusBadge');
  if (el) el.innerHTML = `<span class="status-badge ${statusClass[d.status] || ''}">${d.statusLabel}</span>`;

  buildProgressSteps(d);

  const fields = {
    dKurir:d.kurir, dResi:d.resi, dLayanan:d.layanan,
    dTglOrder:d.tglOrder, dTglKirim:d.tglKirim, dEstTiba:d.estTiba,
    dJenis:d.jenis, dJumlah:d.jumlah, dBerat:d.berat,
    dOngkir:d.ongkir, dAsuransi:d.asuransi, dTotal:d.total,
    dPenerima:d.penerima, dUpbjj:d.upbjj, dAlamat:d.alamat,
  };
  Object.entries(fields).forEach(([id, val]) => setText(id, val));

  // Timeline
  const ul = document.getElementById('timelineList');
  if (!ul) return;
  ul.innerHTML = '';
  d.history.forEach((h, i) => {
    const li = document.createElement('li');
    li.className = 'timeline-item';
    li.style.animationDelay = `${i * 0.06}s`;
    li.innerHTML = `
      <div class="timeline-dot ${h.color}"></div>
      <div class="timeline-time">${h.time}</div>
      <div class="timeline-event">${h.event}</div>
      <div class="timeline-loc">📍 ${h.loc}</div>`;
    ul.appendChild(li);
  });
}

function buildProgressSteps(d) {
  const track = document.getElementById('progressTrack');
  if (!track) return;
  track.querySelectorAll('.progress-step').forEach(el => el.remove());
  const activeIdx = STATUS_STEP_MAP[d.status];

  TRACKING_STEPS.forEach((s, i) => {
    const isActive = i === activeIdx;
    const isDone   = i < activeIdx || (i === activeIdx && d.status === 'delivered');
    const div = document.createElement('div');
    div.className = 'progress-step';
    div.innerHTML = `
      <div class="step-dot ${isDone ? 'done' : isActive ? 'active' : ''}">
        <span class="step-icon">${isDone ? '✓' : s.icon}</span>
      </div>
      <div class="step-label ${isDone ? 'done' : isActive ? 'active' : ''}">${s.label}</div>`;
    track.appendChild(div);
  });
}

function animateProgressBar(d) {
  const fill = document.getElementById('progressFill');
  if (!fill) return;
  const pct = (STATUS_STEP_MAP[d.status] / (TRACKING_STEPS.length - 1)) * 90;
  fill.style.width = pct + '%';
}

// Lacak paket (fungsi alias dari script asli, kompatibel dengan HTML lama)
function lacakPaket() {
  const input = document.getElementById('noDO') || document.getElementById('doInput');
  if (!input || !input.value.trim()) { alert('Masukkan Nomor DO!'); return; }
  if (document.getElementById('doInput')) {
    document.getElementById('doInput').value = input.value;
  }
  handleSearch();
}


/* ══════════════════════════════════════════════════════
   7. STOK BAHAN AJAR
══════════════════════════════════════════════════════ */
let stokData     = [];   // salinan kerja dari dataBahanAjar
let stokFiltered = [];
let stokSortCol  = '';
let stokSortDir  = 1;

function initStok() {
  const user = requireLogin() || { nama: 'Guest', role: 'Guest', email: '' };
  startClock();
  applyUserUI(user);

  // Salin data dari data.js
  if (typeof dataBahanAjar !== 'undefined') {
    stokData = dataBahanAjar.map(d => ({ ...d }));
  }

  buildFakultasFilter();
  renderSummaryCards();
  applyStokFilter();
  initSortHeaders();

  // Search realtime
  const searchEl = document.getElementById('searchBox');
  if (searchEl) searchEl.addEventListener('input', applyStokFilter);
}

// Alias dari script asli
function renderStok() { initStok(); }

function buildFakultasFilter() {
  const sel = document.getElementById('filterFakultas');
  if (!sel) return;
  const list = [...new Set(stokData.map(d => d.fakultas))].sort();
  list.forEach(f => {
    const o = document.createElement('option');
    o.value = f; o.textContent = f;
    sel.appendChild(o);
  });
}

function renderSummaryCards() {
  const strip = document.getElementById('summaryStrip');
  if (!strip) return;
  const cards = [
    { label:'Total Item',      val: stokData.length,                              icon:'📚', bg:'var(--blue-l)'   },
    { label:'Tersedia',        val: stokData.filter(d=>d.status==='Tersedia').length, icon:'✅', bg:'var(--green-l)'  },
    { label:'Stok Terbatas',   val: stokData.filter(d=>d.status==='Terbatas').length, icon:'⚠️', bg:'var(--orange-l)' },
    { label:'Habis',           val: stokData.filter(d=>d.status==='Habis').length,    icon:'❌', bg:'var(--red-l)'    },
  ];
  strip.innerHTML = cards.map(c => `
    <div class="sum-card">
      <div class="sum-icon" style="background:${c.bg}">${c.icon}</div>
      <div><div class="sum-label">${c.label}</div><div class="sum-value">${c.val}</div></div>
    </div>`).join('');
}

function applyStokFilter() {
  const q      = (document.getElementById('searchBox')?.value || '').toLowerCase().trim();
  const status = document.getElementById('filterStatus')?.value  || '';
  const fak    = document.getElementById('filterFakultas')?.value || '';
  const jenis  = document.getElementById('filterJenis')?.value   || '';

  stokFiltered = stokData.filter(d => {
    const matchQ = !q || d.judul.toLowerCase().includes(q)
      || d.kode_mk.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
      || d.fakultas.toLowerCase().includes(q);
    return matchQ
      && (!status || d.status   === status)
      && (!fak    || d.fakultas === fak)
      && (!jenis  || d.jenis    === jenis);
  });

  if (stokSortCol) sortStok(stokSortCol, false);
  renderStokTable();
}

function initSortHeaders() {
  document.querySelectorAll('th[data-col]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      stokSortDir = stokSortCol === col ? stokSortDir * -1 : 1;
      stokSortCol = col;
      document.querySelectorAll('th').forEach(t => t.classList.remove('sorted'));
      th.classList.add('sorted');
      const arrow = th.querySelector('.sort-arrow');
      if (arrow) arrow.textContent = stokSortDir === 1 ? '↑' : '↓';
      sortStok(col, true);
    });
  });
}

function sortStok(col, rerender = true) {
  stokFiltered.sort((a, b) => {
    const va = a[col], vb = b[col];
    if (typeof va === 'number') return (va - vb) * stokSortDir;
    return String(va).localeCompare(String(vb)) * stokSortDir;
  });
  if (rerender) renderStokTable();
}

function renderStokTable(newId = null) {
  const tbody  = document.getElementById('stokTableBody') || document.getElementById('tableBody');
  const empty  = document.getElementById('emptyState');
  const countEl = document.getElementById('countLabel');
  if (!tbody) return;

  if (countEl) countEl.textContent = `${stokFiltered.length} item`;

  if (!stokFiltered.length) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  tbody.innerHTML = stokFiltered.map(d => buildStokRow(d, d.id === newId)).join('');
}

function buildStokRow(d, isNew = false) {
  const stokPct  = d.jenis === 'Digital' ? 100
    : d.stok_min > 0 ? Math.min(100, Math.round(d.stok / (d.stok_min * 4) * 100)) : Math.min(100, d.stok);
  const barColor = d.status === 'Habis' ? 'var(--red)' : d.status === 'Terbatas' ? 'var(--orange)' : 'var(--green)';
  const statusClass = { Tersedia:'status-tersedia', Terbatas:'status-terbatas', Habis:'status-habis' }[d.status] || '';
  const jenisClass  = { 'Cetak':'jenis-cetak', 'Digital':'jenis-digital', 'Cetak & Digital':'jenis-cetak-digital' }[d.jenis] || '';
  const stokDisplay = d.jenis === 'Digital' ? '∞' : d.stok.toLocaleString('id-ID');
  const warnMsg     = d.jenis !== 'Digital' && d.stok > 0 && d.stok <= d.stok_min
    ? `<div class="stok-warn">⚠ Di bawah minimum (${d.stok_min})</div>` : '';
  const hargaFmt = 'Rp ' + d.harga.toLocaleString('id-ID');

  return `<tr class="${isNew ? 'new-row' : ''}" data-id="${d.id}">
    <td class="td-id">${d.id}</td>
    <td class="td-judul">${d.judul}</td>
    <td class="td-kode">${d.kode_mk}</td>
    <td><span class="badge-fakultas">${d.fakultas}</span></td>
    <td><span class="badge-jenis ${jenisClass}">${d.jenis}</span></td>
    <td>
      <div class="stok-wrap">
        <div class="stok-num">${stokDisplay}</div>
        <div class="stok-bar-bg"><div class="stok-bar-fill" style="width:${stokPct}%;background:${barColor};"></div></div>
        ${warnMsg}
      </div>
    </td>
    <td class="td-harga">${hargaFmt}</td>
    <td class="td-edisi">${d.edisi || '—'}</td>
    <td><span class="badge-status ${statusClass}">${d.status}</span></td>
    <td><button class="btn-delete" onclick="deleteStokRow('${d.id}')" title="Hapus">🗑</button></td>
  </tr>`;
}

function deleteStokRow(id) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (row) {
    row.style.transition = 'opacity 0.3s, transform 0.3s';
    row.style.opacity = '0'; row.style.transform = 'translateX(20px)';
    setTimeout(() => {
      stokData = stokData.filter(d => d.id !== id);
      applyStokFilter();
      renderSummaryCards();
      showToast('🗑️', 'Bahan ajar berhasil dihapus.', 'red');
    }, 300);
  }
}

// Alias dari script asli (kompatibel dengan HTML lama)
function addNewRow() {
  const kode  = document.getElementById('newKode')?.value?.trim();
  const nama  = document.getElementById('newNama')?.value?.trim();
  const stok  = document.getElementById('newStok')?.value;
  if (!kode || !nama || !stok) { alert('Mohon lengkapi semua field sebelum menambah data.'); return; }
  submitStokForm({ kode_mk: kode, judul: nama, stok: parseInt(stok) });
  ['newKode','newNama','newStok'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
}

// ── MODAL STOK ──
function openStokModal() {
  const modal = document.getElementById('modalBackdrop');
  if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
  clearStokErrors();
}

function closeStokModal() {
  const modal = document.getElementById('modalBackdrop');
  if (modal) { modal.classList.remove('open'); document.body.style.overflow = ''; }
  clearStokForm();
}

function handleStokBackdropClick(e) {
  if (e.target === document.getElementById('modalBackdrop')) closeStokModal();
}

function clearStokForm() {
  ['fJudul','fKodeMk','fFakultas','fJenis','fStok','fStokMin','fHarga','fEdisi','fSemester']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  clearStokErrors();
}

function clearStokErrors() {
  document.querySelectorAll('.form-err').forEach(el => el.classList.remove('show'));
  document.querySelectorAll('.form-input, .form-select').forEach(el => el.classList.remove('err'));
}

function submitStokForm(prefill = null) {
  if (!prefill) clearStokErrors();

  let valid = true;
  function getVal(id)  { return document.getElementById(id)?.value?.trim() || ''; }
  function errField(inputId, errId) {
    document.getElementById(inputId)?.classList.add('err');
    document.getElementById(errId)?.classList.add('show');
    valid = false;
  }

  const judul    = prefill?.judul    || getVal('fJudul');
  const kodeMk   = prefill?.kode_mk  || getVal('fKodeMk');
  const fakultas = prefill?.fakultas || getVal('fFakultas');
  const jenis    = prefill?.jenis    || getVal('fJenis');
  const stokRaw  = prefill?.stok     ?? parseInt(getVal('fStok'));
  const stokMin  = parseInt(getVal('fStokMin'))  || 0;
  const hargaRaw = parseInt(getVal('fHarga'))    || 0;
  const edisi    = getVal('fEdisi');
  const semester = getVal('fSemester');

  if (!prefill) {
    if (!judul)             errField('fJudul',    'eJudul');
    if (!kodeMk)            errField('fKodeMk',   'eKodeMk');
    if (!fakultas)          errField('fFakultas', 'eFakultas');
    if (!jenis)             errField('fJenis',    'eJenis');
    if (isNaN(stokRaw) || stokRaw < 0) errField('fStok', 'eStok');
    if (!hargaRaw || hargaRaw <= 0)    errField('fHarga','eHarga');
    if (!valid) return;
  }

  const stok   = isNaN(stokRaw) ? 0 : stokRaw;
  const harga  = hargaRaw || 0;
  const jenisFinal = jenis || 'Cetak';

  let status;
  if (jenisFinal === 'Digital')     status = 'Tersedia';
  else if (stok === 0)              status = 'Habis';
  else if (stok <= stokMin)         status = 'Terbatas';
  else                              status = 'Tersedia';

  const maxId = stokData.reduce((acc, d) => {
    const n = parseInt(d.id.replace('BA-','')) || 0;
    return n > acc ? n : acc;
  }, 0);
  const newId = 'BA-' + String(maxId + 1).padStart(3,'0');

  const newItem = {
    id: newId, judul: judul || kodeMk, kode_mk: kodeMk,
    fakultas: fakultas || 'Umum', jenis: jenisFinal,
    stok: jenisFinal === 'Digital' ? 999 : stok,
    stok_min: stokMin, harga, status,
    edisi: edisi || '—',
    semester: semester || '2024/2025 Ganjil',
  };

  stokData.unshift(newItem);
  applyStokFilter();
  renderSummaryCards();
  closeStokModal();

  setTimeout(() => {
    const row = document.querySelector(`tr[data-id="${newId}"]`);
    if (row) row.scrollIntoView({ behavior:'smooth', block:'center' });
  }, 100);

  showToast('✅', `"${newItem.judul}" berhasil ditambahkan!`, 'green');
}

// Alias publik untuk tombol di HTML
function openModal()     { openStokModal(); }
function closeModal()    { closeStokModal(); }
function submitForm()    { submitStokForm(); }

// Membuat row (kompatibel dengan script asli)
function createRow(kode, nama, stok, lokasi = 'OTMP01') {
  submitStokForm({ kode_mk: kode, judul: nama, stok: parseInt(stok) || 0, fakultas: lokasi });
}


/* ══════════════════════════════════════════════════════
   8. TOAST NOTIFIKASI — dipakai di semua halaman
══════════════════════════════════════════════════════ */
function showToast(icon, msg, type = 'green') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position:fixed;bottom:28px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
    document.body.appendChild(container);
  }
  const bg = type === 'red' ? '#8c1a1a' : type === 'orange' ? '#b85c00' : '#1e5c3a';
  const toast = document.createElement('div');
  toast.style.cssText = `background:${bg};color:#fff;border-radius:12px;padding:12px 18px;font-size:13.5px;font-weight:600;display:flex;align-items:center;gap:10px;box-shadow:0 8px 32px rgba(0,0,0,0.22);animation:toastIn 0.35s cubic-bezier(0.34,1.4,0.64,1) both;pointer-events:all;font-family:'Plus Jakarta Sans',sans-serif;`;
  toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity='0'; toast.style.transform='translateY(8px)'; toast.style.transition='all 0.3s'; setTimeout(()=>toast.remove(),300); }, 3200);
}


/* ══════════════════════════════════════════════════════
   9. HELPER UTILITIES
══════════════════════════════════════════════════════ */
function toggleEl(id, show) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('visible', show);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? '—';
}