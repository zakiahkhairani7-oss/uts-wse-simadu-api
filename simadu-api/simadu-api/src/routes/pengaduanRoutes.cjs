'use strict';
const { Router } = require('express');
const controller = require('../controllers/pengaduanController.cjs');
const authenticate = require('../middleware/authenticate.cjs');
const authorize = require('../middleware/authorize.cjs');
const { validateBody, validateQuery, validateId, schemas } = require('../middleware/validate.cjs');
const { ROLE } = require('../utils/constants.cjs');

const router = Router();

router.use(authenticate); // semua endpoint pengaduan wajib login (401)

// Urutan: authenticate (401) -> authorize (403) -> validasi (400) -> controller (404/403 kepemilikan)
router.get('/', validateQuery(schemas.listQuery), controller.list);
router.get('/:id', validateId, controller.detail);
router.post('/', authorize(ROLE.MAHASISWA), validateBody(schemas.pengaduan), controller.create);
router.put('/:id', authorize(ROLE.MAHASISWA), validateId, validateBody(schemas.pengaduan), controller.update);
router.patch('/:id/status', authorize(ROLE.ADMIN), validateId, validateBody(schemas.status), controller.updateStatus);
router.delete('/:id', authorize(ROLE.MAHASISWA), validateId, controller.remove);

module.exports = router;
