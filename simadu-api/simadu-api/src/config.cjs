'use strict';
require('dotenv').config();
const crypto = require('node:crypto');

const env = process.env.NODE_ENV || 'development';

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  if (env === 'production') {
    throw new Error('JWT_SECRET wajib diisi (minimal 32 karakter) pada mode production.');
  }
  // Mode pengembangan: secret acak per proses. Token lama otomatis tidak berlaku setelah restart.
  jwtSecret = crypto.randomBytes(48).toString('hex');
  console.warn('[CONFIG] JWT_SECRET belum diatur; memakai secret acak sementara.');
}

const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

module.exports = {
  env,
  port: toPositiveInt(process.env.PORT, 3000),
  jwtSecret,
  tokenTtlSeconds: toPositiveInt(process.env.JWT_EXPIRES_IN_SECONDS, 3600),
  bcryptRounds: toPositiveInt(process.env.BCRYPT_ROUNDS, 10),
};
