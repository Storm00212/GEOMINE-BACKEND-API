import jwt from "jsonwebtoken";

export type JwtClaims = {
  sub: string; // user id
  role: "miner" | "it" | "admin";
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET in environment variables.");
  }
  return secret;
}

export function signAccessToken(claims: JwtClaims) {
  const secret = getJwtSecret();
  return jwt.sign(claims, secret, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): JwtClaims {
  const secret = getJwtSecret();
  const decoded = jwt.verify(token, secret);
  return decoded as JwtClaims;
}

