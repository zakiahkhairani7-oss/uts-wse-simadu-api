'use strict';
const authService = require('../services/authService.cjs');
const { unauthorized } = require('../utils/errors.cjs');

const BEARER = /^Bearer ([A-Za-z0-9\-._~+/]+=*)$/i;

// Autentikasi: "siapa Anda?" -> 401 jika token tidak ada / salah format / tidak sah / kedaluwarsa.
module.exports = function authenticate(req, res, next) {
  const match = BEARER.exec(req.get('Authorization') || '');
  if (!match) throw unauthorized('Token autentikasi tidak ditemukan atau format salah');
  req.user = authService.verifyToken(match[1]);
  next();
};
