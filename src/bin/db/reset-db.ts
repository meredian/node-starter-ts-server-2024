import { getEnvConfig } from 'common/config';
import { resetDb } from 'db/connect-utils';
import { buildLogger } from 'common/logger';

const config = getEnvConfig();
const logger = buildLogger(config);

(async () => {
  await resetDb(logger, config);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
