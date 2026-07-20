// server.js
// Server Express untuk aplikasi KenMap - versi Postgres.
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const path = require("path");

const { pool, initSchema } = require("./db");

const authRoutes = require("./routes/auth");
const stoRoutes = require("./routes/sto");
const odcRoutes = require("./routes/odc");
const oltRoutes = require("./routes/olt");
const odpRoutes = require("./routes/odp");
const kabelRoutes = require("./routes/kabel");
const klienRoutes = require("./routes/klien");
const pinsRoutes = require("./routes/pins");
const pengaturanRoutes = require("./routes/pengaturan");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

app.use(express.json());

// Production: serve hasil build Vite dari folder dist/
// Development: frontend dijalankan via `npm run dev:frontend` di port 5173
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "dist")));
} else {
  app.use(express.static("public"));
}

// Session disimpan di Postgres (tabel 'session', dibuat otomatis oleh
// connect-pg-simple kalau createTableIfMissing: true) - jadi login tidak
// hilang saat container di-restart, dan konsisten kalau nanti scale > 1 instance.
app.use(
  session({
    store: new pgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "VFIsFKQCw1JDKsoG7DlT2vJJggYM1PurdoAG2rqn4i4=",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }, // sesi login bertahan 8 jam
  }),
);

/* ==========================================================
   ROUTES
   - /api/login, /api/logout, /api/me  -> tidak perlu login (auth itu sendiri)
   - GET data (odc/odp/kabel/klien)    -> boleh diakses tanpa login (untuk peta)
   - POST/PUT/DELETE                    -> wajib login (requireAuth)
========================================================== */
app.use("/api", authRoutes);
app.use("/api/sto", stoRoutes);
app.use("/api/odc", odcRoutes);
app.use("/api/olt", oltRoutes);
app.use("/api/odp", odpRoutes);
app.use("/api/kabel", kabelRoutes);
app.use("/api/klien", klienRoutes);
app.use("/api/pins", pinsRoutes);
app.use("/api/pengaturan", pengaturanRoutes);

// Error handler terpusat - semua route pakai next(err) kalau ada error query,
// jadi tidak ada unhandled promise rejection yang bikin server crash diam-diam.
app.use((err, req, res, next) => {
  console.error("[unhandled error]", err);
  res.status(500).json({ error: "Terjadi kesalahan pada server." });
});

async function start() {
  try {
    await initSchema(); // buat tabel + migrasi + seed pengaturan & admin default
    app.listen(PORT, HOST, () => {
      console.log("==========================================");
      console.log("  Server KenMap (Postgres) berjalan:");
      console.log(`  http://localhost:${PORT}`);
      console.log("  Tekan Ctrl+C untuk menghentikan server");
      console.log("==========================================");
    });
  } catch (err) {
    console.error("Gagal inisialisasi database / server:", err);
    process.exit(1);
  }
}

start();
