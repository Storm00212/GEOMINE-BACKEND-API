// FILE PURPOSE:
// - Defines validation schemas for requests in the sensors module.
//
// NOTE: This file currently contains paused implementation code for team review.
//

// import { z } from 'zod';
//
// export const createSensorReadingSchema = z.object({
//   body: z.object({
//     ballMillId: z.string().uuid(),
//     currentAmp: z.number().nonnegative(),
//     temperature: z.number().nonnegative(),
//     runtimeHours: z.number().nonnegative(),
//     timestamp: z.string().refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Invalid timestamp' }),
//   }),
// });
//
// export const getSensorReadingsSchema = z.object({
//   params: z.object({ ballMillId: z.string().uuid() }),
// });