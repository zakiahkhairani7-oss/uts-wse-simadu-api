'use strict';

const KATEGORI = Object.freeze(['Fasilitas', 'Akademik', 'TI']);
const STATUS = Object.freeze({ DIAJUKAN: 'diajukan', DIPROSES: 'diproses', SELESAI: 'selesai' });
const STATUS_VALUES = Object.freeze(Object.values(STATUS));
const ROLE = Object.freeze({ MAHASISWA: 'mahasiswa', ADMIN: 'admin' });

module.exports = { KATEGORI, STATUS, STATUS_VALUES, ROLE };
