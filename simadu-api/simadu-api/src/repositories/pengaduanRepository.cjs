'use strict';
const { STATUS } = require('../utils/constants.cjs');

let items = [];
let nextId = 1;

const copy = (x) => (x ? { ...x } : null);

function reset() {
  items = [
    { id: 1, mahasiswaId: 'TI24001', judul: 'AC ruang kelas rusak', kategori: 'Fasilitas',
      deskripsi: 'AC di ruang B-203 tidak dingin sejak minggu lalu.', status: STATUS.DIAJUKAN,
      createdAt: '2026-11-19T08:30:00.000Z' },
    { id: 2, mahasiswaId: 'TI24002', judul: 'KRS tidak bisa disimpan', kategori: 'Akademik',
      deskripsi: 'Sistem akademik menolak penyimpanan KRS semester ini.', status: STATUS.DIAJUKAN,
      createdAt: '2026-11-19T09:00:00.000Z' },
    { id: 3, mahasiswaId: 'TI24001', judul: 'Wi-Fi perpustakaan lambat', kategori: 'TI',
      deskripsi: 'Koneksi sering terputus pada jam 10.00-14.00.', status: STATUS.DIPROSES,
      createdAt: '2026-11-19T09:15:00.000Z' },
  ];
  nextId = 4;
}
reset();

module.exports = {
  reset,
  findAll({ mahasiswaId, status, kategori } = {}) {
    return items
      .filter((p) => (mahasiswaId ? p.mahasiswaId === mahasiswaId : true))
      .filter((p) => (status ? p.status === status : true))
      .filter((p) => (kategori ? p.kategori === kategori : true))
      .map(copy);
  },
  findById: (id) => copy(items.find((p) => p.id === id)),
  create(data) {
    const record = { id: nextId++, ...data }; // ID dibuat di sini, bukan oleh client
    items.push(record);
    return copy(record);
  },
  update(id, patch) {
    const record = items.find((p) => p.id === id);
    if (!record) return null;
    Object.assign(record, patch);
    return copy(record);
  },
  remove(id) {
    const index = items.findIndex((p) => p.id === id);
    if (index === -1) return false;
    items.splice(index, 1);
    return true;
  },
};
