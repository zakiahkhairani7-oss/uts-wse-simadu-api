'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, tokenTtlSeconds, bcryptRounds } = require('../config.cjs');
const userRepository = require('../repositories/userRepository.cjs');
const { unauthorized } = require('../utils/errors.cjs');

// Hash pembanding agar waktu respons tetap mirip saat username tidak ditemukan.
const DUMMY_HASH = bcrypt.hashSync('tidak-dipakai', bcryptRounds);
const INVALID_TOKEN_MESSAGE = 'Token tidak valid atau sudah kedaluwarsa';

async function login({ username, password }) {
  const user = userRepository.findByUsername(username);
  const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !passwordOk) {
    throw unauthorized('Username atau password salah'); // pesan sama untuk kedua kasus
  }

  const token = jwt.sign({ role: user.role, mahasiswaId: user.mahasiswaId }, jwtSecret, {
    algorithm: 'HS256',
    subject: String(user.id),
    expiresIn: tokenTtlSeconds, // kedaluwarsa dicek otomatis oleh jwt.verify
  });

  return {
    token,
    tokenType: 'Bearer',
    expiresIn: tokenTtlSeconds,
    user: { id: user.id, nama: user.nama, role: user.role, mahasiswaId: user.mahasiswaId },
  };
}

function verifyToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }); // cek tanda tangan + exp
  } catch {
    throw unauthorized(INVALID_TOKEN_MESSAGE);
  }
  // Identitas diambil dari data server (berdasarkan sub), bukan dipercaya mentah dari client.
  const user = userRepository.findById(Number(payload.sub));
  if (!user) throw unauthorized(INVALID_TOKEN_MESSAGE);
  return { id: user.id, nama: user.nama, role: user.role, mahasiswaId: user.mahasiswaId };
}

module.exports = { login, verifyToken };
