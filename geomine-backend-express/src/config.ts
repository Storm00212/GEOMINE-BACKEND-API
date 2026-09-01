import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

// Postgres bigint columns come back from $queryRaw as JS BigInt, which JSON.stringify can't serialize. Serialize as a string instead.
(BigInt.prototype as any).toJSON = function (this: bigint) {
  return this.toString();
};

// Reads the JWT signing secret, throwing early if it's missing.
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET in environment variables.");
  }
  return secret;
}

// Builds the CORS allowlist from a hardcoded set of origins plus ALLOWED_ORIGINS.
export function getAllowedOrigins(): string[] {
  const defaults = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://geomine-backend-api-frontend.onrender.com",
  ];
  const raw = process.env.ALLOWED_ORIGINS || "";
  const configured = raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  return Array.from(new Set([...defaults, ...configured]));
}

export const PORT = Number(process.env.PORT) || 4000;

// A shared Prisma client singleton.
export const prisma = new PrismaClient();
