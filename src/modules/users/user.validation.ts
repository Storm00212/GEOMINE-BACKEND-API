// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { z } from 'zod';
//
// export const createUserSchema = z.object({
//   body: z.object({
//     name: z.string().min(2),
//     email: z.string().email(),
//     password: z.string().min(8),
//     role: z.enum(['ADMIN', 'MINER']),
//   }),
// });
//
// export const updateUserSchema = z.object({
//   body: z.object({
//     name: z.string().min(2).optional(),
//     email: z.string().email().optional(),
//     password: z.string().min(8).optional(),
//     role: z.enum(['ADMIN', 'MINER']).optional(),
//     isActive: z.boolean().optional(),
//   }),
//   params: z.object({ id: z.string().uuid() }),
// });
//
// export const getUserSchema = z.object({
//   params: z.object({ id: z.string().uuid() }),
// });