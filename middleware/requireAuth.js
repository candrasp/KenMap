// middleware/requireAuth.js
// Middleware untuk memproteksi endpoint yang butuh login admin.
// Pakai di route dengan: app.use('/api/odp', requireAuth, odpRouter)

function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  return res.status(401).json({ error: 'Belum login. Silakan login terlebih dahulu.' });
}

module.exports = requireAuth;
