# Node.js server starter

Fresh state as of 27.10.2024

- Node 22
- Typescript 5.6 + SWC for speed
- Prettier
- ESLint (with new 9.0 "flat" config)
- Jest
- Most basic files: Config file + pino logger
- PostgreSQL DB connection with [Drizzle ORM](https://orm.drizzle.team/)

## Quick start

- `npm install` to install
- `npm run db:reset` to create database & apply all migrations
- `npm run dev` to start app in dev-mode
- `npm test` to test

## DB Management

- `npm run db:migration:gen <name> [--custom]` to generate migration from schemd
- `npm run db:migrate` to apply migration
