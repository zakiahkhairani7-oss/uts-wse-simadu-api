'use strict';
const { Router } = require('express');
const controller = require('../controllers/authController.cjs');
const { validateBody, schemas } = require('../middleware/validate.cjs');

const router = Router();
router.post('/login', validateBody(schemas.login), controller.login);

module.exports = router;
