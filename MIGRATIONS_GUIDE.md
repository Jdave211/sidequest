# Database Migrations

This project uses `node-pg-migrate` for database migrations.

## Setup

The database connection is configured in `.env`:
```
DATABASE_URL=postgresql://postgres.mwzeumckccvkrsmixsea:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres
```

## Commands

### Create a new migration
```bash
npm run migrate:create migration-name
```

This project is configured for SQL migrations (`migration-file-language: sql`).
Use this format inside each migration file:

```sql
-- migrate:up
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- migrate:down
DROP TABLE IF EXISTS users;
```

### Run pending migrations
```bash
npm run migrate:up
```

### Rollback the last migration
```bash
npm run migrate:down
```

### Run all migrations (same as migrate:up)
```bash
npm run migrate
```

## Migration Files

Migration files are stored in the `./migrations` directory and contain `-- migrate:up` / `-- migrate:down` SQL sections.

## Converting Existing SQL Files

If you have existing SQL files (like `spaces-schema.sql`), you can convert them to migrations by:

1. Creating a new migration: `npm run migrate:create your-migration-name`
2. Copying your SQL into the `-- migrate:up` section
3. Adding rollback SQL to `-- migrate:down`
