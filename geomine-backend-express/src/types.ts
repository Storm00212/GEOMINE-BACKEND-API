import type { profiles } from "@prisma/client";

export type UserRole = "miner" | "it" | "admin";
export type MachineStatus = "active" | "maintenance" | "decommissioned";
export type PhaseType = "single_phase" | "three_phase";
export type EntryMethod = "manual" | "sensor";

export type JwtClaims = {
  sub: string;
  role: UserRole;
};

export type AuthContext = {
  userId: string;
  profile: profiles;
  role: UserRole;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Not permitted") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// A duplicate-resource conflict, such as an email already in use.
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
