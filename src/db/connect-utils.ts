import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { Config } from 'common/config';
import { Pool, PoolConfig } from 'pg';
import { parse } from 'pg-connection-string';
import { Logger } from 'pino';
import { DatabaseConfig, DbResetMode } from './types';

export const getDb = <T extends Record<string, unknown>>(
  config: DatabaseConfig,
): NodePgDatabase<T> & {
  end: () => void;
} => {
  return getDbWithPoolConfig({
    connectionString: config.connString,
    max: config.maxPoolConnections,
  });
};

const getDbWithPoolConfig = <T extends Record<string, unknown>>(
  config: PoolConfig,
): NodePgDatabase<T> & {
  end: () => void;
} => {
  const pool = new Pool(config);
  const db = drizzle(pool) as NodePgDatabase<T>;
  (db as any).end = () => pool.end();
  return db as NodePgDatabase<T> & { end: () => void };
};

const parsePgConnString = (pgConnString: string): PoolConfig => {
  const connOptions = parse(pgConnString);
  return {
    host: connOptions.host || undefined,
    port: parseInt(connOptions.port || '', 10) || undefined,
    user: connOptions.user,
    password: connOptions.password,
    database: connOptions.database || undefined,
    ssl: connOptions.ssl ? { rejectUnauthorized: true } : false,
  };
};

export const createDatabase = async (logger: Logger, config: Config) => {
  const connection = parsePgConnString(config.db.connString);
  const dbName = connection.database || connection.user;
  logger.info(`Creating database ${dbName}`);
  // We can't create / delete database while being connected to that database,
  // so we need to switch to master database
  connection.database = 'postgres';
  const db = getDbWithPoolConfig(connection);

  // Check if expected table exists. PSQL does not support
  // CREATE DATABASE IF NOT EXISTS so we do it manually
  const { rows } = await db.execute(
    sql`SELECT datname FROM pg_catalog.pg_database WHERE datname = ${dbName}`,
  );

  if (rows.length === 0) {
    // Binding '?' is not working for CREATE DATABASE
    await db.execute(
      `CREATE DATABASE ${dbName} ENCODING='UTF8' LOCALE='C' TEMPLATE='template0'`,
    );
    logger.info(`Database ${dbName} created`);
  } else {
    logger.info(`Database ${dbName} already exists`);
  }
  db.end();
};

export const resetDb = async (logger: Logger, config: Config) => {
  if (config.db.resetMode === DbResetMode.Recreate) {
    // We just DROP & CREATE databases, used for dev envs
    await dropDatabase(logger, config);
    await createDatabase(logger, config);
  } else if (config.db.resetMode === DbResetMode.DropTables) {
    // We delete every existing table so we can re-run migrations
    // Use for managed databases (e.g. Yandex-Cloud)
    throw new Error('Not implemented');
  } else {
    throw new Error(
      `We can't reset database with reset mode ${config.db.resetMode}`,
    );
  }
  const db = getDb(config.db);
  db.end();
};

export const dropDatabase = async (logger: Logger, config: Config) => {
  if (config.db.resetMode === DbResetMode.None) {
    throw new Error(
      `Dropping database is disabled for env ${config.env}. Please do it manually if it's what you want`,
    );
  }

  const connection = parsePgConnString(config.db.connString);
  const dbName = connection.database || connection.user;
  logger.info(`Dropping database ${dbName}`);
  // We can't create / delete database while being connected to that database,
  // so we need to switch to master database
  connection.database = 'postgres';
  const db = getDbWithPoolConfig(connection);

  // Binding '?' is not working for DROP DATABASE
  await db.execute(`DROP DATABASE IF EXISTS ${dbName}`);
  logger.info(`Database ${dbName} dropped`);
  db.end();
};
