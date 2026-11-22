'use strict';
const service = require('../services/pengaduanService.cjs');
const { success } = require('../utils/response.cjs');

const list = (req, res) =>
  success(res, 200, 'Daftar pengaduan berhasil diambil', service.list(req.user, req.validated.query));

const detail = (req, res) =>
  success(res, 200, 'Detail pengaduan berhasil diambil', service.getById(req.user, req.validated.id));

const create = (req, res) =>
  success(res, 201, 'Pengaduan berhasil dibuat', service.create(req.user, req.validated.body));

const update = (req, res) =>
  success(res, 200, 'Pengaduan berhasil diperbarui', service.update(req.user, req.validated.id, req.validated.body));

const updateStatus = (req, res) =>
  success(res, 200, 'Status pengaduan berhasil diperbarui', service.updateStatus(req.validated.id, req.validated.body.status));

const remove = (req, res) => {
  service.remove(req.user, req.validated.id);
  success(res, 200, 'Pengaduan berhasil dihapus', null);
};

module.exports = { list, detail, create, update, updateStatus, remove };
