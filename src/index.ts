import { drizzle } from 'drizzle-orm/node-postgres';
import { getEnvConfig } from 'common/config';
import { buildLogger } from 'common/logger';

// Makes to load .env file into process.env
const config = getEnvConfig();
const logger = buildLogger(config);

(async () => {
  const db = drizzle({
    connection: {
      connectionString: config.db.connString,
      max: config.db.maxPoolConnections,
    },
  });

  await db.execute('select 1');
  logger.info('DB works fine');
})().catch((err: Error) => {
  logger.fatal(err);
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  logger.fatal({ err }, 'uncaughtException');
  process.exit(1);
});

process.on('unhandledRejection', (err: Error, promise: Promise<unknown>) => {
  logger.fatal({ err, promise }, 'unhandledRejection');
  process.exit(1);
});

process.on('SIGINT', function () {
  logger.info('SIGINT received, interrupting...');
  setTimeout(() => process.exit(1), config.gracefulShutdownTimeoutMs);
});
