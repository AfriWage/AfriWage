# @AfriWage/db

Drizzle ORM schema and connection wrapper for AfriWage's PostgreSQL persistence.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm generate` | Generate a Drizzle migration from a schema change (explicit, local only). |
| `pnpm migrate` | Apply pending migrations to the database named by `POSTGRES_URL` (explicit, local only). |
| `pnpm type-check` | Strict TypeScript validation of the package source (`tsc --noEmit`). |
| `pnpm build` | Deterministic compile/declaration validation (`tsc`) — output is written to `dist/` for validation only; consumers resolve the package from `src/`. |

## CI contract

`type-check` and `build` are wired into the repository's Turborepo/CI pipeline, so a
malformed schema or index change fails CI before merge. Migration commands
(`generate`, `migrate`) are intentionally excluded from CI and never run against
production — they require a `POSTGRES_URL` and are executed explicitly by a developer.

## Environment

- `POSTGRES_URL` — Postgres connection string read at runtime by `src/index.ts` and by
  `drizzle.config.ts` for migrations.
