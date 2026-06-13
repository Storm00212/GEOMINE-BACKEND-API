import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://geomine_user:geomine_password@localhost:5432/geomine_db?schema=public',
  jwtSecret: process.env.JWT_SECRET ?? 'supersecretjwtkey',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  saltRounds: Number(process.env.SALT_ROUNDS ?? 12),
  logLevel: process.env.LOG_LEVEL ?? 'info',
};
