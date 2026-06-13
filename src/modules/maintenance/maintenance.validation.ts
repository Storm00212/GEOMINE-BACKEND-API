// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { z } from 'zod';
//
// export const createMaintenanceSchema = z.object({
//   body: z.object({
//     ballMillId: z.string().uuid(),
//     eventType: z.string().min(3),
//     notes: z.string().optional(),
//     performedBy: z.string().min(2),
//     maintenanceDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Invalid date' }),
//   }),
// });
//
// export const getMaintenanceSchema = z.object({
//   params: z.object({ ballMillId: z.string().uuid() }),
// });