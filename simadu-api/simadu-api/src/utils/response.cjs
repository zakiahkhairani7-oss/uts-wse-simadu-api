'use strict';

const success = (res, status, message, data = null) =>
  res.status(status).json({ status: 'success', message, data });

module.exports = { success };
