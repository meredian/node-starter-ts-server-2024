import { getEnvConfig } from 'common/config';
import { getDb } from 'db/connect-utils';
import { buildLogger } from 'common/logger';
import { delay } from 'common/utils/delay';

const config = getEnvConfig();
const logger = buildLogger(config);
const RETRY_TIMEOUT_MS = 1000;

const ALLOW_REPLICA_FLAG = '--allow-replica';

(async () => {
  const allowReplica = process.argv.includes(ALLOW_REPLICA_FLAG);
  logger.info(
    `Waiting for DB connection, replica ${
      allowReplica ? 'IS' : 'IS NOT'
    } allowed`,
  );
  let dbIsUp = false;
  while (!dbIsUp) {
    try {
      const db = getDb(config.db);
      const result = await db.execute(`SELECT pg_is_in_recovery();`);
      const isReplica = result.rows[0].pg_is_in_recovery;
      if ((isReplica && allowReplica) || !isReplica) {
        dbIsUp = true;
      } else if (isReplica) {
        throw new Error(
          `Replica connected, not master. Use ${ALLOW_REPLICA_FLAG} flag to allow it`,
        );
      }
    } catch (err) {
      logger.info(
        { err },
        `Error connecting DB, retrying in ${RETRY_TIMEOUT_MS} ms`,
      );
      await delay(1000);
    }
  }
  logger.info('Database is present & operational');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
