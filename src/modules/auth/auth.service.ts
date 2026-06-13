// FILE PURPOSE:
// - Implements business logic for the auth module.
//
// NOTE: This file currently contains paused implementation code for team review.
//

// import { hashPassword, comparePassword } from '@shared/utils/hash.util';
// import { signJwt } from '@shared/utils/jwt.util';
// import { findUserByEmail, createUser } from './auth.repository.js';
// import { HttpError } from '@shared/errors/http.error';
//
// export const login = async (email: string, password: string) => {
//   const user = await findUserByEmail(email);
//   if (!user) {
//     throw new HttpError(401, 'Invalid credentials');
//   }
//
//   const passwordValid = await comparePassword(password, user.passwordHash);
//   if (!passwordValid) {
//     throw new HttpError(401, 'Invalid credentials');
//   }
//
//   const token = signJwt({ userId: user.id, role: user.role });
//   return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
// };
//
// export const register = async (name: string, email: string, password: string, role: string) => {
//   const existing = await findUserByEmail(email);
//   if (existing) {
//     throw new HttpError(409, 'Email already in use');
//   }
//
//   const passwordHash = await hashPassword(password);
//   const user = await createUser({ name, email, passwordHash, role });
//   const token = signJwt({ userId: user.id, role: user.role });
//   return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
// };