'use strict';
const config = require('../config.cjs');

// Log akses ringkas. SENGAJA tidak mencatat header (Authorization), body, maupun query string,
// sehingga token dan data sensitif tidak pernah masuk log.
module.exports = function requestLogger(req, res, next) {
  if (config.env === 'test') return next();
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} ${ms.toFixed(1)}ms`);
  });
  next();
};
