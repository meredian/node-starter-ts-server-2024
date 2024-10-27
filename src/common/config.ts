import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import clone from 'clone';
import dotenv from 'dotenv';
import { bool, cleanEnv, num, port, str } from 'envalid';

import { deepFreezeSilent } from './utils/deep-freeze';
import { deepMerge } from './utils/deep-merge';
import { DeepPartial } from './utils/types';
import type { LevelWithSilent } from './logger';

import pkg from '../../package.json';
import { DatabaseConfig, DbResetMode } from 'db/types';
import { as } from './utils/type-helpers';

interface ProcessEnv {
  [key: string]: string | undefined;
}

export type NodeEnvName = 'development' | 'production' | 'test';
const NODE_ENVS: Array<NodeEnvName> = ['development', 'production', 'test'];
const DEFAULT_ENV = 'development';
const DEFAULT_TEST_ENV = 'test';

const CONFIG_FOLDER_PATH = path.join(__dirname, '../../config');

const loadEnv = (): ProcessEnv => {
  const env = process.env.ENV || process.env.NODE_ENV || DEFAULT_ENV;
  const staticConfig = loadStaticConfigForEnv(env);
  const staticSecretConfig = loadStaticConfigForEnv(`${env}.secret`);

  // We check for process.env since loading config can modify that so that
  // we can use ENV only with setting NODE_ENV automatically
  if (staticConfig.NODE_ENV !== 'test') {
    // We don't load .env file for test environment to prevent parameter pollution
    // for test.
    dotenv.config();
  }

  _.defaults(
    process.env,
    { ENV: env, NODE_ENV: DEFAULT_ENV },
    staticSecretConfig,
    staticConfig,
  );

  return process.env;
};

const loadConfigFromFile = (configFilePath: string): ProcessEnv => {
  try {
    return JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
  } catch (_err) {
    throw new Error(`Failed to load config from ${configFilePath}`);
  }
};

const loadStaticConfigForEnv = (env: string): ProcessEnv => {
  const configFilePath = path.join(CONFIG_FOLDER_PATH, env + '.json');

  if (fs.existsSync(configFilePath)) {
    return loadConfigFromFile(configFilePath);
  }

  return {};
};

const extendedProcessEnv = (envExtension: ProcessEnv): ProcessEnv => {
  return _.defaults(clone(process.env), envExtension);
};

export const getTestConfig = (
  overrides?: DeepPartial<Config>,
  workerIndex?: number,
) => {
  const env = process.env.ENV || process.env.NODE_ENV || DEFAULT_TEST_ENV;

  const staticEnv = extendedProcessEnv(loadStaticConfigForEnv(env));
  if (staticEnv.NODE_ENV === 'test') {
    return buildConfig(mangleTestEnv(staticEnv, workerIndex), overrides);
  } else {
    // provided env is not test one, so fallback to default test env;
    const staticTestEnv = extendedProcessEnv(loadStaticConfigForEnv('test'));
    return buildConfig(mangleTestEnv(staticTestEnv, workerIndex), overrides);
  }
};

export const mangleTestEnv = (
  env: ProcessEnv,
  workerIndex?: number,
): ProcessEnv => {
  const jestWorkerId = env.JEST_WORKER_ID
    ? parseInt(env.JEST_WORKER_ID)
    : undefined;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fallbackWorkerIndex = workerIndex || jestWorkerId;
  // Mangle with test env for concurrent test runs
  // e.g. set different port or different db connection string
  return env;
};

let cachedEnvConfig: Config | undefined = undefined;

export const getEnvConfig = (): Config => {
  if (cachedEnvConfig) {
    return cachedEnvConfig;
  }
  cachedEnvConfig = buildConfig(loadEnv());
  return cachedEnvConfig;
};

const buildCleanEnv = (inputEnv: ProcessEnv) => {
  return cleanEnv(
    inputEnv,
    {
      // NODE_ENV=development is for local/stagings
      // NODE_ENV=test disables loading dynamic config & uses only static
      // NODE_ENV=production triggers all kind of internal node optimisations
      NODE_ENV: str<NodeEnvName>({ choices: NODE_ENVS }),
      // ENV is used to describe specific deployment scope
      ENV: str<string>({ default: DEFAULT_ENV }),
      IS_PRODUCTION_ENV: bool({ default: false }),
      SERVICE_NAME: str<string>({ default: pkg.name }),
      PORT: port({ default: 3000 }),
      HEALTHCHECK_TIMEOUT_MS: num({ default: 30000 }),
      GRACEFUL_SHUTDOWN_TIMEOUT_MS: num({ default: 15000 }),

      SSE_HISTORY_TIMEFRAME_SEC: num({ default: 600 }),
      SSE_RETRY: num({ default: 1000 }),

      LOG_LEVEL: str<LevelWithSilent>({
        default: 'info',
        choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      }),
      LOG_FILE_LEVEL: str<LevelWithSilent>({
        default: 'silent',
        choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      }),
      LOG_FILE_NAME: str({ default: undefined }),
      LOG_LEVEL_IS_STRINGIFIED: bool({ default: true }),

      DB_RESET_MODE: str<DbResetMode>({
        devDefault: DbResetMode.Recreate,
        default: DbResetMode.None,
        choices: [
          DbResetMode.None,
          DbResetMode.Recreate,
          DbResetMode.DropTables,
        ],
      }),
      DB_CONNECTION_STRING: str(),
      DB_MAX_POOL_CONNECTIONS: num({ default: 10 }),
    },
    {
      reporter: ({ errors }) => {
        if (Object.keys(errors).length > 0) {
          const missingEnvs = _.map(
            errors,
            (e, name) => `${name}: ${e?.message}`,
          ).join('\n');
          throw new Error(`Failed to load config from env:\n${missingEnvs}`);
        }
      },
    },
  );
};

const buildConfigObject = (inputEnv: ProcessEnv) => {
  const env = buildCleanEnv(inputEnv);

  if (env.IS_PRODUCTION_ENV && !env.isProduction) {
    throw new Error(
      `PRODUCTION env is set to true, but NODE_ENV is not production`,
    );
  }

  return {
    // env.isProduction is set by library when NODE_ENV=production
    // but we have set on all server deployments, that doesn't help to distinct them
    // prod vs dev servers. So we define our own `isDeployment` (any server,
    // not dev local machine or testing pipeline) and `isProd` (is production) flags
    isProd: env.isProduction && env.IS_PRODUCTION_ENV,
    isDeployment: env.isProduction,
    isDev: env.isDevelopment,
    isTest: env.isTest,
    serviceName: env.SERVICE_NAME,
    env: env.ENV,
    // We don't use NODE_ENV anywhere directly, but it
    // triggers some configuration behaviours
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    logger: {
      level: env.LOG_LEVEL,
      levelIsStringified: env.LOG_LEVEL_IS_STRINGIFIED,
      file: {
        level: env.LOG_FILE_LEVEL,
        name: env.LOG_FILE_NAME,
      },
    },
    db: as<DatabaseConfig>({
      resetMode: env.DB_RESET_MODE,
      connString: env.DB_CONNECTION_STRING,
      maxPoolConnections: env.DB_MAX_POOL_CONNECTIONS,
    }),
    gracefulShutdownTimeoutMs: env.GRACEFUL_SHUTDOWN_TIMEOUT_MS,
  };
};

export type Config = ReturnType<typeof buildConfigObject>;

export const buildConfig = (
  inputEnv: ProcessEnv,
  overrides?: DeepPartial<Config>,
) => {
  if (overrides) {
    return deepFreezeSilent(deepMerge(buildConfigObject(inputEnv), overrides));
  } else {
    return deepFreezeSilent(buildConfigObject(inputEnv));
  }
};
