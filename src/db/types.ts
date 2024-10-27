export enum DbResetMode {
  None = 'none',
  Recreate = 'recreate',
  DropTables = 'drop_tables',
}

export type DatabaseConfig = {
  log: boolean;
  resetMode: DbResetMode;
  connString: string;
  maxPoolConnections: number;
};
