'use strict';
const { forbidden } = require('../utils/errors.cjs');

// Otorisasi berbasis role: "bolehkah Anda?" -> 403 jika role tidak diizinkan.
module.exports = (...allowedRoles) =>
  function authorize(req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw forbidden('Anda tidak memiliki izin untuk operasi ini');
    }
    next();
  };
