'use strict';
const authService = require('../services/authService.cjs');
const { success } = require('../utils/response.cjs');

async function login(req, res) {
  const result = await authService.login(req.validated.body);
  success(res, 200, 'Login berhasil', result);
}

module.exports = { login };
