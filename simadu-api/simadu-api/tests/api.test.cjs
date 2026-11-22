'use strict';
// Uji integrasi 12 skenario UTS + beberapa skenario keamanan tambahan.
// Jalankan: npm test  (membutuhkan dependensi terpasang: npm install)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'rahasia-uji-minimal-32-karakter-aman-1234567890';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app.cjs');
const pengaduanRepository = require('../src/repositories/pengaduanRepository.cjs');

let server, base;
const tokens = {};

async function call(method, path, { token, body, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined || raw !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(base + path, {
    method,
    headers,
    body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json() };
}
const login = async (username, password) => (await call('POST', '/api/auth/login', { body: { username, password } }));

before(async () => {
  pengaduanRepository.reset();
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
  tokens.mhs1 = (await login('mhs1', 'Mhs1#2026')).json.data.token;
  tokens.mhs2 = (await login('mhs2', 'Mhs2#2026')).json.data.token;
  tokens.admin = (await login('admin', 'Admin#2026')).json.data.token;
});
after(() => server.close());

const valid = { judul: 'Proyektor rusak', kategori: 'Fasilitas', deskripsi: 'Proyektor ruang A-101 tidak menyala.' };

test('01 login benar -> 200 + token', async () => {
  const r = await login('mhs1', 'Mhs1#2026');
  assert.equal(r.status, 200);
  assert.ok(r.json.data.token);
  assert.equal(r.json.data.user.passwordHash, undefined);
});
test('02 login password salah -> 401', async () => assert.equal((await login('mhs1', 'salah')).status, 401));
test('03 tanpa token -> 401', async () => assert.equal((await call('GET', '/api/pengaduan')).status, 401));
test('04 token tidak valid -> 401', async () =>
  assert.equal((await call('GET', '/api/pengaduan', { token: 'abc.def.ghi' })).status, 401));

let createdId;
test('05 mahasiswa membuat pengaduan valid -> 201, pemilik dari token', async () => {
  const r = await call('POST', '/api/pengaduan', { token: tokens.mhs1, body: valid });
  assert.equal(r.status, 201);
  assert.equal(r.json.data.mahasiswaId, 'TI24001');
  assert.equal(r.json.data.status, 'diajukan');
  createdId = r.json.data.id;
});
test('06 mahasiswa membaca pengaduan sendiri -> 200', async () =>
  assert.equal((await call('GET', `/api/pengaduan/${createdId}`, { token: tokens.mhs1 })).status, 200));
test('07 mahasiswa membaca pengaduan orang lain -> 403', async () =>
  assert.equal((await call('GET', `/api/pengaduan/${createdId}`, { token: tokens.mhs2 })).status, 403));
test('08 mahasiswa mengubah status -> 403', async () =>
  assert.equal((await call('PATCH', `/api/pengaduan/${createdId}/status`, { token: tokens.mhs1, body: { status: 'selesai' } })).status, 403));
test('09 admin melihat seluruh pengaduan -> 200', async () => {
  const r = await call('GET', '/api/pengaduan', { token: tokens.admin });
  assert.equal(r.status, 200);
  assert.ok(r.json.data.length >= 4);
});
test('10 admin memperbarui status -> 200', async () => {
  const r = await call('PATCH', `/api/pengaduan/${createdId}/status`, { token: tokens.admin, body: { status: 'diproses' } });
  assert.equal(r.status, 200);
  assert.equal(r.json.data.status, 'diproses');
  assert.equal(r.json.data.mahasiswaId, 'TI24001'); // pemilik tidak berubah
});
test('11 field wajib kosong -> 400', async () =>
  assert.equal((await call('POST', '/api/pengaduan', { token: tokens.mhs1, body: { judul: '', kategori: 'TI', deskripsi: '' } })).status, 400));
test('12 ID tidak ditemukan -> 404', async () =>
  assert.equal((await call('GET', '/api/pengaduan/9999', { token: tokens.admin })).status, 404));

// ---- Tambahan keamanan ----
test('13 mahasiswa tidak bisa menyetel mahasiswaId/id/status -> 400', async () => {
  const r = await call('POST', '/api/pengaduan', { token: tokens.mhs1, body: { ...valid, mahasiswaId: 'TI24002', id: 99, status: 'selesai' } });
  assert.equal(r.status, 400);
});
test('14 mahasiswa tidak bisa lihat daftar milik orang lain', async () => {
  const r = await call('GET', '/api/pengaduan', { token: tokens.mhs2 });
  assert.ok(r.json.data.every((p) => p.mahasiswaId === 'TI24002'));
});
test('15 ubah/hapus saat status bukan diajukan -> 403', async () => {
  assert.equal((await call('PUT', `/api/pengaduan/${createdId}`, { token: tokens.mhs1, body: valid })).status, 403);
  assert.equal((await call('DELETE', `/api/pengaduan/${createdId}`, { token: tokens.mhs1 })).status, 403);
});
test('16 mahasiswa mengubah pengaduan orang lain -> 403 dan data tidak berubah', async () => {
  const sebelum = await call('GET', '/api/pengaduan/2', { token: tokens.admin });
  const r = await call('PUT', '/api/pengaduan/2', { token: tokens.mhs1, body: valid });
  const sesudah = await call('GET', '/api/pengaduan/2', { token: tokens.admin });
  assert.equal(r.status, 403);
  assert.deepEqual(sesudah.json.data, sebelum.json.data);
});
test('17 admin tidak boleh membuat/mengubah/menghapus -> 403', async () => {
  assert.equal((await call('POST', '/api/pengaduan', { token: tokens.admin, body: valid })).status, 403);
  assert.equal((await call('PUT', '/api/pengaduan/1', { token: tokens.admin, body: valid })).status, 403);
  assert.equal((await call('DELETE', '/api/pengaduan/1', { token: tokens.admin })).status, 403);
});
test('18 input ditolak tidak mengubah data (PUT tidak valid)', async () => {
  const sebelum = await call('GET', '/api/pengaduan/1', { token: tokens.mhs1 });
  const r = await call('PUT', '/api/pengaduan/1', { token: tokens.mhs1, body: { judul: 'x', kategori: 'Lain', deskripsi: '' } });
  const sesudah = await call('GET', '/api/pengaduan/1', { token: tokens.mhs1 });
  assert.equal(r.status, 400);
  assert.deepEqual(sesudah.json.data, sebelum.json.data);
});
test('19 JSON rusak -> 400; ID bukan angka -> 400; status tidak valid -> 400', async () => {
  assert.equal((await call('POST', '/api/pengaduan', { token: tokens.mhs1, raw: '{rusak' })).status, 400);
  assert.equal((await call('GET', '/api/pengaduan/abc', { token: tokens.admin })).status, 400);
  assert.equal((await call('PATCH', '/api/pengaduan/1/status', { token: tokens.admin, body: { status: 'batal' } })).status, 400);
});
test('20 mahasiswa menghapus pengaduan sendiri berstatus diajukan -> 200 lalu 404', async () => {
  const baru = await call('POST', '/api/pengaduan', { token: tokens.mhs2, body: valid });
  const id = baru.json.data.id;
  assert.equal((await call('DELETE', `/api/pengaduan/${id}`, { token: tokens.mhs2 })).status, 200);
  assert.equal((await call('GET', `/api/pengaduan/${id}`, { token: tokens.mhs2 })).status, 404);
});
test('21 rute tidak dikenal -> 404 JSON seragam', async () => {
  const r = await call('GET', '/api/tidak-ada', { token: tokens.admin });
  assert.equal(r.status, 404);
  assert.equal(r.json.status, 'error');
});
