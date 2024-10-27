export enum DbResetMode {
  None = 'none',
  Recreate = 'recreate',
  DropTables = 'drop_tables',
}

export type DatabaseConfig = {
  resetMode: DbResetMode;
  connString: string;
  maxPoolConnections: number;
};
