# DATABASE_URL Configuration Guide

This document ensures DATABASE_URL is properly configured and used throughout the GEOMINE Backend API application.

## Overview

`DATABASE_URL` is the primary environment variable used to connect to PostgreSQL databases. It's essential for:

- **Prisma Client** - ORM for database operations
- **Prisma Migrations** - Schema management
- **Prisma Seed** - Database initialization
- **Application Runtime** - All database connections

## Configuration Locations

### 1. **Environment Files** (Primary)

- **`.env`** - Local development and runtime configuration
- **`.env.example`** - Template for setting up new environments

The `DATABASE_URL` from `.env` is read by:

- **dotenv** (via `src/config/env.ts`)
- **Prisma** (via `prisma/schema.prisma`)
- **Docker containers** (via `env_file` in docker-compose.yml)

### 2. **Source Code Files**

#### `src/config/env.ts`

Loads and exports all environment variables:

```typescript
export const config = {
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://...',
  // ... other config
};
```

**Usage**: Imported by any module needing configuration

#### `src/config/database.ts`

Initializes Prisma Client:

```typescript
export const prisma = new PrismaClient();
```

**Note**: Prisma automatically uses DATABASE_URL from environment

#### `prisma/schema.prisma`

Defines the Prisma datasource:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Critical**: Prisma requires DATABASE_URL at migration and generation time

#### `prisma/seed.ts`

Uses PrismaClient for database seeding:

```typescript
const prisma = new PrismaClient();
```

**Note**: Automatically uses DATABASE_URL from environment

### 3. **Docker Configuration**

#### `docker-compose.yml`

Passes `.env` file to the backend service:

```yaml
services:
  backend:
    env_file:
      - .env
```

This makes DATABASE_URL available inside the container.

The postgres service is for local development only. For production with external databases (Supabase, AWS RDS, etc.), ensure DATABASE_URL in `.env` points to your external database.

#### `Dockerfile`

Production-ready multi-stage build that:

1. Installs dependencies
2. Generates Prisma client (requires DATABASE_URL)
3. Builds TypeScript
4. Runs the application

**Note**: DATABASE_URL must be provided at runtime:

```bash
docker run -e DATABASE_URL="postgresql://..." IMAGE_NAME
```

## Setup Instructions

### Local Development (with docker-compose)

1. **Create `.env` file** from `.env.example`:

   ```bash
   cp .env.example .env
   ```

2. **Update DATABASE_URL** (optional, defaults to local postgres):

   ```env
   DATABASE_URL=postgresql://geomine_user:geomine_password@localhost:5432/geomine_db?schema=public
   ```

3. **Start services**:

   ```bash
   docker-compose up --build
   ```

4. **Run migrations**:
   ```bash
   npm run prisma:migrate
   ```

### Local Development (without Docker)

1. **Ensure PostgreSQL is running** on localhost:5432

2. **Create `.env` file**:

   ```env
   DATABASE_URL=postgresql://geomine_user:geomine_password@localhost:5432/geomine_db?schema=public
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Run migrations**:

   ```bash
   npm run prisma:migrate
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

### Production Deployment (External Database)

#### With Supabase

```env
DATABASE_URL=postgresql://postgres.IDENTIFIER:PASSWORD@REGION.pooler.supabase.com:5432/postgres?schema=public&sslmode=require
```

#### With AWS RDS

```env
DATABASE_URL=postgresql://admin:PASSWORD@database.REGION.rds.amazonaws.com:5432/geomine_db?schema=public&sslmode=require
```

#### With Azure Database for PostgreSQL

```env
DATABASE_URL=postgresql://admin@servername:PASSWORD@servername.postgres.database.azure.com:5432/geomine_db?schema=public&sslmode=require
```

## Important Notes

### ✅ Dos

- ✅ Always set DATABASE_URL before running migrations or the application
- ✅ Use environment variables for DATABASE_URL in production (never hardcode)
- ✅ Test DATABASE_URL connection before deploying
- ✅ Keep DATABASE_URL secrets secure (add `.env` to `.gitignore`)
- ✅ Use connection pooling for production databases (e.g., Supabase pooler)

### ❌ Don'ts

- ❌ Commit `.env` files to version control
- ❌ Use weak passwords in DATABASE_URL
- ❌ Hardcode database credentials in source code
- ❌ Share DATABASE_URL in public repositories or communications
- ❌ Leave default credentials in production

## Troubleshooting

### "Error: connect ECONNREFUSED"

- Verify PostgreSQL is running
- Check DATABASE_URL hostname and port
- Ensure firewall allows database connections

### "Error: password authentication failed"

- Verify username and password in DATABASE_URL
- Check for special characters that need URL encoding (e.g., `#` → `%23`)

### "Error: database does not exist"

- Check database name in DATABASE_URL
- Run migrations: `npm run prisma:migrate`

### Prisma Cannot Find DATABASE_URL

- Ensure `.env` file exists in project root
- Run: `npm run prisma:generate`
- Restart the application

## Verification

To verify DATABASE_URL is correctly configured:

```bash
# Check Prisma connection
npm run prisma:studio

# Run tests
npm test

# Check logs
docker-compose logs backend
```

## Summary of DATABASE_URL Usage

| Component              | How It Gets DATABASE_URL   | Status    |
| ---------------------- | -------------------------- | --------- |
| `src/config/env.ts`    | `process.env.DATABASE_URL` | ✅ Active |
| `prisma/schema.prisma` | `env("DATABASE_URL")`      | ✅ Active |
| `prisma/seed.ts`       | PrismaClient (from env)    | ✅ Active |
| Docker backend service | `.env` file via `env_file` | ✅ Active |
| Dockerfile runtime     | Environment variable       | ✅ Active |
| app.ts / server.ts     | Via config import          | ✅ Active |
| All repositories       | Via prisma import          | ✅ Active |

All components properly utilize DATABASE_URL for database connectivity.
