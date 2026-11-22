# SIMADU API

REST API **Sistem Layanan Informasi dan Pengaduan Mahasiswa** (SIMADU) berbasis Node.js dan Express 5.
Mahasiswa dapat menyampaikan dan mengelola pengaduannya sendiri; administrator dapat melihat seluruh
pengaduan dan memperbarui status penanganannya. Akses dilindungi autentikasi Bearer Token (JWT),
otorisasi berbasis role dan kepemilikan data, serta validasi input yang ketat.

## Fitur
- Login dengan password ter-hash (bcrypt) dan Bearer Token (JWT, HS256) yang memiliki masa berlaku.
- Otorisasi berdasarkan role (`mahasiswa`, `admin`) dan kepemilikan pengaduan.
- Validasi input berbasis whitelist: field kosong, tipe salah, dan field tidak diperbolehkan ditolak (400).
- Error handler terpusat (400, 401, 403, 404, 500) dengan format respons seragam dan tanpa kebocoran detail internal.
- Dokumentasi OpenAPI 3 dan Swagger UI.
- Data awal in-memory: 2 mahasiswa, 1 administrator, dan 3 pengaduan contoh.

## Prasyarat
- Node.js **versi 20 atau lebih baru** (`node -v`)
- npm (bawaan Node.js)
- Postman, Swagger UI, atau HTTP client lain (opsional, untuk pengujian)

## Instalasi
```bash
git clone <url-repository>
cd simadu-api
npm install
```

## Konfigurasi (.env)
Salin berkas contoh lalu sesuaikan nilainya. **Jangan commit berkas `.env`.**
```bash
cp .env.example .env        # Windows (CMD): copy .env.example .env
```

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `PORT` | Tidak | `3000` | Port server |
| `NODE_ENV` | Tidak | `development` | `production` mewajibkan `JWT_SECRET` yang valid |
| `JWT_SECRET` | Ya (production) | acak per proses saat development | Kunci penanda tangan token, minimal 32 karakter |
| `JWT_EXPIRES_IN_SECONDS` | Tidak | `3600` | Masa berlaku token (detik) |
| `BCRYPT_ROUNDS` | Tidak | `10` | Biaya hashing bcrypt |

Membuat `JWT_SECRET` acak:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Tanpa `JWT_SECRET` di mode development, server memakai secret acak sementara sehingga semua token
tidak berlaku lagi setelah server di-restart.

## Menjalankan Server
```bash
npm start          # menjalankan server.cjs
npm run dev        # mode watch (restart otomatis saat kode berubah)
```
Server aktif di `http://localhost:3000`. Pemeriksaan cepat: `GET http://localhost:3000/health`.

## Swagger UI
Buka **http://localhost:3000/docs** setelah server berjalan.
1. Jalankan `POST /api/auth/login` dari Swagger UI dengan salah satu akun uji.
2. Salin nilai `token` dari respons.
3. Klik **Authorize**, tempel token (tanpa kata `Bearer`), lalu **Authorize**.
4. Endpoint terlindungi kini dapat dicoba.

Berkas kontrak: `src/docs/openapi.json`.

## Akun Uji (khusus pengembangan)
| Role | Username | Password | mahasiswaId |
|---|---|---|---|
| admin | `admin` | `Admin#2026` | - |
| mahasiswa | `mhs1` | `Mhs1#2026` | `TI24001` |
| mahasiswa | `mhs2` | `Mhs2#2026` | `TI24002` |

Data disimpan di memori dan **kembali ke data awal setiap server di-restart**.

## Ringkasan Endpoint dan Hak Akses
| Metode | Endpoint | Fungsi | Akses | Sukses |
|---|---|---|---|---|
| POST | `/api/auth/login` | Login, menghasilkan token | Publik | 200 |
| GET | `/api/pengaduan` | Daftar pengaduan (mahasiswa: miliknya; admin: semua) | Mahasiswa, Admin | 200 |
| GET | `/api/pengaduan/:id` | Detail pengaduan | Pemilik atau Admin | 200 |
| POST | `/api/pengaduan` | Membuat pengaduan | Mahasiswa | 201 |
| PUT | `/api/pengaduan/:id` | Mengubah judul, kategori, deskripsi | Mahasiswa pemilik, status `diajukan` | 200 |
| PATCH | `/api/pengaduan/:id/status` | Memperbarui status | Admin | 200 |
| DELETE | `/api/pengaduan/:id` | Menghapus pengaduan | Mahasiswa pemilik, status `diajukan` | 200 |

Endpoint selain login memerlukan header `Authorization: Bearer <token>`.
`id`, `mahasiswaId`, `status` awal, dan `createdAt` ditentukan server; `mahasiswaId` berasal dari token.

### Format respons
```json
{ "status": "success", "message": "Pesan singkat", "data": {} }
{ "status": "error", "message": "Pesan singkat", "errors": [{ "field": "judul", "message": "Judul wajib diisi" }] }
```
Properti `errors` hanya muncul pada kesalahan validasi (400).

### Status HTTP
| Status | Arti di SIMADU |
|---|---|
| 200 / 201 | Berhasil / resource dibuat |
| 400 | Input tidak valid, JSON rusak, ID bukan bilangan bulat positif, atau ada field terlarang |
| 401 | Token tidak ada, salah format, tidak valid, atau kedaluwarsa; atau login gagal |
| 403 | Terautentikasi tetapi tidak berhak (role, bukan pemilik, atau status bukan `diajukan`) |
| 404 | Pengaduan atau endpoint tidak ditemukan |
| 500 | Kesalahan server (pesan generik; detail hanya di log server) |

## Struktur Proyek dan Tanggung Jawab Lapisan
```
simadu-api/
├── app.cjs                 # perakitan aplikasi Express (tanpa listen)
├── server.cjs              # menjalankan server
├── src/
│   ├── config.cjs          # pembacaan konfigurasi .env
│   ├── routes/             # pemetaan endpoint + urutan middleware
│   ├── controllers/        # adaptor HTTP
│   ├── services/           # aturan bisnis
│   ├── repositories/       # akses data (in-memory)
│   ├── middleware/         # authenticate, authorize, validate, errorHandler, requestLogger
│   ├── utils/              # konstanta, AppError, helper respons
│   └── docs/openapi.json   # kontrak OpenAPI
├── tests/api.test.cjs      # uji integrasi
├── .env.example
└── README.md
```

| Lapisan | Tanggung jawab | Tidak boleh |
|---|---|---|
| **routes** | Memetakan metode + path ke middleware dan controller; menyusun urutan `authenticate` → `authorize` → validasi | Berisi logika bisnis |
| **middleware** | `authenticate` (verifikasi token, 401), `authorize` (role, 403), `validate` (whitelist field, tipe, panjang, enum, 400), `errorHandler` (respons error seragam), `requestLogger` (log tanpa token) | Mengakses data langsung |
| **controllers** | Mengambil data tervalidasi dan `req.user`, memanggil service, menentukan status HTTP dan bentuk respons | Berisi aturan bisnis atau mengakses repository |
| **services** | Aturan bisnis: kepemilikan, status `diajukan`, penetapan `mahasiswaId`/`status`/`createdAt`, hash dan token | Mengetahui `req`/`res` |
| **repositories** | Operasi data (cari, simpan, ubah, hapus) pada array memori; membuat `id` | Berisi aturan bisnis atau mengetahui HTTP |

Urutan pemeriksaan sebuah request:
`authenticate (401)` → `authorize (403)` → `validasi (400)` → `service: data ada? (404)` → `pemilik & status (403)`.

## Pengujian
Otomatis (21 skenario, termasuk 12 skenario UTS):
```bash
npm test
```
Manual: gunakan Postman atau Swagger UI dengan akun uji di atas. Server perlu di-restart sebelum
pengujian manual agar data kembali ke kondisi awal.

## Catatan Keamanan
- Password disimpan sebagai hash bcrypt; password asli tidak pernah disimpan di memori setelah proses hashing awal.
- Token tidak dicatat ke log; logger hanya mencatat metode, path, status, dan durasi.
- Server ini berjalan di HTTP untuk pengembangan. Gunakan HTTPS (TLS) pada lingkungan produksi.
