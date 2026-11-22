'use strict';
const bcrypt = require('bcryptjs');
const { bcryptRounds } = require('../config.cjs');
const { ROLE } = require('../utils/constants.cjs');

// Data awal: 2 mahasiswa + 1 administrator. Password hanya dipakai sekali untuk membuat hash
// saat start; yang tersimpan di memori hanya passwordHash.
const SEED = [
  { id: 1, username: 'admin', nama: 'Admin Layanan', role: ROLE.ADMIN, mahasiswaId: null, password: 'Admin#2026' },
  { id: 2, username: 'mhs1', nama: 'Budi Santoso', role: ROLE.MAHASISWA, mahasiswaId: 'TI24001', password: 'Mhs1#2026' },
  { id: 3, username: 'mhs2', nama: 'Siti Aminah', role: ROLE.MAHASISWA, mahasiswaId: 'TI24002', password: 'Mhs2#2026' },
];

const users = SEED.map(({ password, ...u }) => ({
  ...u,
  passwordHash: bcrypt.hashSync(password, bcryptRounds),
}));

const copy = (u) => (u ? { ...u } : null);

module.exports = {
  findByUsername: (username) => copy(users.find((u) => u.username === String(username).toLowerCase())),
  findById: (id) => copy(users.find((u) => u.id === id)),
};
