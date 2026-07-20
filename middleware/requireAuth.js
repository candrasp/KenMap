// middleware/requireAuth.js
// Tidak ada perubahan dari versi SQLite - middleware ini murni cek session,
// tidak menyentuh database sama sekali.
module.exports = function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  return res.status(401).json({ error: "Anda harus login terlebih dahulu." });
};
