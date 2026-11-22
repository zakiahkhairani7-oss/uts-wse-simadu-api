'use strict';
const { port } = require('./src/config.cjs');
const app = require('./app.cjs');

const server = app.listen(port, () => {
  console.log(`SIMADU API berjalan di http://localhost:${port}`);
  console.log(`Swagger UI di http://localhost:${port}/docs`);
});

const shutdown = (signal) => {
  console.log(`${signal} diterima, menutup server...`);
  server.close(() => process.exit(0));
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
