// server.js
// Server Express untuk aplikasi KenMap.
// Menggantikan server statis manual sebelumnya — express.static() sudah
// menangani semua yang dulu ditulis manual (MIME type, baca file, dst),
// ditambah sekarang ada API + login admin.

const express = require('express');
const session = require('express-session');
const { exec } = require('child_process');
const db = require('./db'); // otomatis membuat tabel kalau belum ada

const authRoutes = require('./routes/auth');
const stoRoutes = require('./routes/sto');
const odcRoutes = require('./routes/odc');
const oltRoutes = require('./routes/olt');
const odpRoutes = require('./routes/odp');
const kabelRoutes = require('./routes/kabel');
const klienRoutes = require('./routes/klien');
const pinsRoutes = require('./routes/pins');

const path = require('path');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// Production: serve hasil build Vite dari folder dist/
// Development: frontend dijalankan via `npm run dev:frontend` di port 5173
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
} else {
  // Saat dev, static lama (public/) tetap bisa diakses langsung via Express
  app.use(express.static('public'));
}

app.use(session({
  secret: 'VFIsFKQCw1JDKsoG7DlT2vJJggYM1PurdoAG2rqn4i4=', // WAJIB diganti sebelum dipakai sungguhan
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // sesi login bertahan 8 jam
}));

/* ==========================================================
   ROUTES
   - /api/login, /api/logout, /api/me  -> tidak perlu login (auth itu sendiri)
   - GET data (odc/odp/kabel/klien)    -> boleh diakses tanpa login (untuk peta)
   - POST/PUT/DELETE                    -> wajib login (requireAuth)
========================================================== */
app.use('/api', authRoutes);
app.use('/api/sto', stoRoutes);
app.use('/api/odc', odcRoutes);
app.use('/api/olt', oltRoutes);
app.use('/api/odp', odpRoutes);
app.use('/api/kabel', kabelRoutes);
app.use('/api/klien', klienRoutes);
app.use('/api/pins', pinsRoutes); // Unified pin endpoint (odc/odp/klien)
// Proteksi login (requireAuth) sudah dipasang langsung di masing-masing
// route POST/PUT/DELETE di dalam file routes/*.js, jadi GET tetap bisa
// diakses tanpa login (dipakai untuk menampilkan data di peta), sementara
// operasi ubah data wajib login.

app.listen(PORT, HOST, () => {
  const os = require('os');
  const nets = os.networkInterfaces();
  let localIp = 'unknown';
  for (const iface of Object.values(nets)) {
    for (const net of iface) {
      if (net.family === 'IPv4' && !net.internal) {
        localIp = net.address;
        break;
      }
    }
    if (localIp !== 'unknown') break;
  }

  console.log('==========================================');
  console.log('  Server KenMap berjalan:');
  console.log(`  Local   : http://localhost:${PORT}`);
  console.log(`  Network : http://${localIp}:${PORT}`);
  console.log('  Tekan Ctrl+C untuk menghentikan server');
  console.log('==========================================');

  // const localUrl = `http://localhost:${PORT}`;
  // const platform = process.platform;
  // let cmd;
  // if (platform === 'win32') cmd = `start "" "${localUrl}"`;
  // else if (platform === 'darwin') cmd = `open "${localUrl}"`;
  // else cmd = `xdg-open "${localUrl}"`;

  // exec(cmd, (err) => {
  //   if (err) {
  //     console.log('Tidak bisa membuka browser otomatis. Buka manual: ' + localUrl);
  //   }
  // });
});