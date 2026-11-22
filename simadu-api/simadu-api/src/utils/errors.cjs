'use strict';

class AppError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.errors = errors; // opsional: daftar { field, message } untuk kesalahan validasi
  }
}

module.exports = {
  AppError,
  badRequest: (message, errors) => new AppError(400, message, errors),
  unauthorized: (message) => new AppError(401, message),
  forbidden: (message) => new AppError(403, message),
  notFound: (message) => new AppError(404, message),
};
