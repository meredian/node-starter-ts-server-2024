import * as p from 'drizzle-orm/pg-core';

export const users = p.pgTable(
  'users',
  {
    id: p.varchar({ length: 32 }).primaryKey(),
    name: p.varchar({ length: 255 }).notNull(),
    email: p.varchar({ length: 255 }).unique().notNull(),
    phoneNumber: p.varchar({ length: 32 }),
    meta: p.jsonb().notNull(),
    createdAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    emails: p.uniqueIndex().on(t.email),
  }),
);
