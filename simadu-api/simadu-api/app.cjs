'use strict';
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./src/docs/openapi.json');
const requestLogger = require('./src/middleware/requestLogger.cjs');
const { notFoundHandler, errorHandler } = require('./src/middleware/errorHandler.cjs');
const authRoutes = require('./src/routes/authRoutes.cjs');
const pengaduanRoutes = require('./src/routes/pengaduanRoutes.cjs');

const app = express();
app.disable('x-powered-by');

app.use(requestLogger);
app.use(express.json({ limit: '10kb' })); // JSON rusak -> error 'entity.parse.failed' -> 400

app.get('/health', (req, res) => res.json({ status: 'success', message: 'SIMADU API berjalan', data: null }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'SIMADU API Docs' }));

app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store'); // respons API (termasuk token) tidak boleh di-cache
  next();
});
app.use('/api/auth', authRoutes);
app.use('/api/pengaduan', pengaduanRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
