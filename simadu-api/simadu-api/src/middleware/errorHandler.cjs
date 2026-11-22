'use strict';
const { AppError, notFound } = require('../utils/errors.cjs');
const config = require('../config.cjs');

// Rute yang tidak terdaftar -> 404 lewat error handler yang sama.
const notFoundHandler = (req, res, next) => next(notFound('Endpoint tidak ditemukan'));

// Express 5 meneruskan error sinkron maupun promise yang ditolak ke sini.
// Harus punya 4 parameter agar dikenali sebagai error handler.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = 500;
  let message = 'Terjadi kesalahan pada server';
  let errors;

  if (err instanceof AppError) {
    ({ status, message, errors } = err);
  } else if (err && err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Format JSON tidak valid';
  } else if (err && err.expose && err.status >= 400 && err.status < 500) {
    // Kesalahan klien dari body-parser (payload terlalu besar, charset tidak didukung, dll.)
    status = 400;
    message = 'Permintaan tidak valid';
  } else if (config.env !== 'test') {
    // Detail hanya ke log server. Tidak pernah mencatat header/body/token; hanya metode, path, dan error.
    console.error(`[ERROR] ${req.method} ${req.path}`, err);
  }

  if (status === 401) res.set('WWW-Authenticate', 'Bearer');
  const body = { status: 'error', message };
  if (errors && errors.length) body.errors = errors;
  res.status(status).json(body);
};

module.exports = { notFoundHandler, errorHandler };
