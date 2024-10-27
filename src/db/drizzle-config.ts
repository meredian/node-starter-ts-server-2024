import { defineConfig } from 'drizzle-kit';
import { MigrationConfig } from 'drizzle-orm/migrator';

export const MIGRATION_CONFIG: MigrationConfig = {
  migrationsFolder: './migrations',
};

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: MIGRATION_CONFIG.migrationsFolder,
  verbose: true,
  breakpoints: false,
});
