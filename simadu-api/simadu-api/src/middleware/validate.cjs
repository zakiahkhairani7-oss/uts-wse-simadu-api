'use strict';
const { badRequest } = require('../utils/errors.cjs');
const { KATEGORI, STATUS_VALUES } = require('../utils/constants.cjs');

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Aturan: whitelist field (field di luar skema ditolak), tipe teks, tidak kosong, panjang, enum.
function check(input, schema) {
  const errors = [];
  const value = {};

  for (const key of Object.keys(input)) {
    if (!Object.hasOwn(schema, key)) {
      errors.push({ field: key, message: `Field '${key}' tidak diperbolehkan` });
    }
  }

  for (const [field, rule] of Object.entries(schema)) {
    const raw = Object.hasOwn(input, field) ? input[field] : undefined;
    if (raw === undefined) {
      if (rule.required) errors.push({ field, message: `${rule.label} wajib diisi` });
      continue;
    }
    if (typeof raw !== 'string') {
      errors.push({ field, message: `${rule.label} harus berupa teks` });
      continue;
    }
    const text = rule.trim === false ? raw : raw.trim();
    if (text.length === 0) {
      errors.push({ field, message: `${rule.label} tidak boleh kosong` });
    } else if (rule.min && text.length < rule.min) {
      errors.push({ field, message: `${rule.label} minimal ${rule.min} karakter` });
    } else if (rule.max && text.length > rule.max) {
      errors.push({ field, message: `${rule.label} maksimal ${rule.max} karakter` });
    } else if (rule.enum && !rule.enum.includes(text)) {
      errors.push({ field, message: `${rule.label} harus salah satu dari: ${rule.enum.join(', ')}` });
    } else {
      value[field] = text;
    }
  }
  return { value, errors };
}

const fail = (errors) => badRequest('Validasi gagal', errors);
const keep = (req, key, value) => {
  req.validated = { ...req.validated, [key]: value };
};

const validateBody = (schema) =>
  function validateBodyMiddleware(req, res, next) {
    if (!isPlainObject(req.body)) {
      throw badRequest('Body harus berupa objek JSON (Content-Type: application/json)');
    }
    const { value, errors } = check(req.body, schema);
    if (errors.length) throw fail(errors);
    keep(req, 'body', value);
    next();
  };

const validateQuery = (schema) =>
  function validateQueryMiddleware(req, res, next) {
    const { value, errors } = check(req.query, schema); // req.query tidak ditimpa (read-only di Express 5)
    if (errors.length) throw fail(errors);
    keep(req, 'query', value);
    next();
  };

function validateId(req, res, next) {
  if (!/^[1-9]\d{0,9}$/.test(req.params.id)) {
    throw badRequest('ID pengaduan harus berupa bilangan bulat positif');
  }
  keep(req, 'id', Number(req.params.id));
  next();
}

const schemas = {
  login: {
    username: { label: 'Username', required: true, max: 50 },
    password: { label: 'Password', required: true, max: 100, trim: false },
  },
  pengaduan: {
    judul: { label: 'Judul', required: true, min: 3, max: 150 },
    kategori: { label: 'Kategori', required: true, enum: KATEGORI },
    deskripsi: { label: 'Deskripsi', required: true, min: 5, max: 2000 },
  },
  status: {
    status: { label: 'Status', required: true, enum: STATUS_VALUES },
  },
  listQuery: {
    status: { label: 'Status', enum: STATUS_VALUES },
    kategori: { label: 'Kategori', enum: KATEGORI },
  },
};

module.exports = { validateBody, validateQuery, validateId, schemas };
