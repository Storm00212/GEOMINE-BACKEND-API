// FILE PURPOSE:
// - Defines validation schemas for requests in the ballmills module.
//
// NOTE: This file currently contains paused implementation code for team review.
//

// import { z } from 'zod';
//
// export const createBallMillSchema = z.object({
//   body: z.object({
//     name: z.string().min(2),
//     location: z.string().min(2),
//     status: z.string().min(2),
//     installedDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Invalid date' }),
//   }),
// });
//
// export const updateBallMillSchema = z.object({
//   body: z.object({
//     name: z.string().min(2).optional(),
//     location: z.string().min(2).optional(),
//     status: z.string().min(2).optional(),
//     installedDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Invalid date' }).optional(),
//   }),
//   params: z.object({ id: z.string().uuid() }),
// });
//
// export const getBallMillSchema = z.object({
//   params: z.object({ id: z.string().uuid() }),
// });