'use strict';
const repo = require('../repositories/pengaduanRepository.cjs');
const { STATUS, ROLE } = require('../utils/constants.cjs');
const { forbidden, notFound } = require('../utils/errors.cjs');

function getOrThrow(id) {
  const item = repo.findById(id);
  if (!item) throw notFound('Pengaduan tidak ditemukan');
  return item;
}

const isOwner = (user, item) =>
  user.role === ROLE.MAHASISWA && user.mahasiswaId === item.mahasiswaId;

function assertCanModify(user, item, aksi) {
  if (!isOwner(user, item)) throw forbidden('Anda tidak berhak mengakses pengaduan ini');
  if (item.status !== STATUS.DIAJUKAN) {
    throw forbidden(`Pengaduan yang sudah diproses tidak dapat ${aksi}`);
  }
}

function list(user, filters) {
  // Mahasiswa dipaksa hanya melihat miliknya; filter dari client tidak bisa menimpanya.
  const scope = user.role === ROLE.ADMIN ? {} : { mahasiswaId: user.mahasiswaId };
  return repo.findAll({ ...filters, ...scope });
}

function getById(user, id) {
  const item = getOrThrow(id);
  if (user.role !== ROLE.ADMIN && !isOwner(user, item)) {
    throw forbidden('Anda tidak berhak mengakses pengaduan ini');
  }
  return item;
}

function create(user, { judul, kategori, deskripsi }) {
  return repo.create({
    mahasiswaId: user.mahasiswaId, // dari token, bukan dari body
    judul,
    kategori,
    deskripsi,
    status: STATUS.DIAJUKAN,
    createdAt: new Date().toISOString(),
  });
}

function update(user, id, { judul, kategori, deskripsi }) {
  const item = getOrThrow(id);
  assertCanModify(user, item, 'diubah');
  return repo.update(id, { judul, kategori, deskripsi });
}

function updateStatus(id, status) {
  getOrThrow(id);
  return repo.update(id, { status }); // hanya field status; pemilik tidak pernah disentuh
}

function remove(user, id) {
  const item = getOrThrow(id);
  assertCanModify(user, item, 'dihapus');
  repo.remove(id);
}

module.exports = { list, getById, create, update, updateStatus, remove };
