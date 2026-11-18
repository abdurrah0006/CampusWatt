import { env } from './src/config/env.js';
import { createApp } from './src/app.js';
import { initDataStore } from './src/repositories/dataStore.js';
import { disconnectDB } from './src/config/db.js';
import { logger } from './src/utils/logger.js';

async function start() {
  const source = await initDataStore();
  const app = createApp();

  const server = app.listen(env.port, () => {
    logger.info(`CampusWatt API listening on http://localhost:${env.port}/api (data source: ${source})`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${env.port} is already in use. Stop the other process or set PORT in backend/.env.`);
    } else {
      logger.error(`Server error: ${err.message}`);
    }
    process.exit(1);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Keep the demo alive: log unexpected async errors instead of crashing.
process.on('unhandledRejection', (reason) => logger.error(`Unhandled rejection: ${reason?.stack || reason}`));

start().catch((err) => {
  logger.error(`Failed to start server: ${err.stack || err.message}`);
  process.exit(1);
});
