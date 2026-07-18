// seed-admin.js
// Skrip sekali-jalan untuk membuat akun admin pertama.
// Jalankan dengan: node seed-admin.js <username> <password>
// Contoh: node seed-admin.js admin rahasia123

const bcrypt = require('bcrypt');
const db = require('./db');

const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.log('Cara pakai: node seed-admin.js <username> <password>');
  process.exit(1);
}

const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username);
if (existing) {
  console.log(`Username "${username}" sudah terdaftar.`);
  process.exit(1);
}

const passwordHash = bcrypt.hashSync(password, 10);
db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(username, passwordHash);

console.log(`Admin "${username}" berhasil dibuat.`);
