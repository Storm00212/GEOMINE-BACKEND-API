// FILE PURPOSE:
// - Defines Express routes for the maintenance module and applies middleware where needed.
//
// NOTE: This file currently contains paused implementation code for team review.
//

// import { Router } from 'express';
// import { authMiddleware } from '@middleware/auth.middleware.js';
// import { roleMiddleware } from '@middleware/role.middleware.js';
// import { validate } from '@shared/validators/zod.middleware.js';
// import { createMaintenanceHandler, getMaintenanceHandler } from './maintenance.controller.js';
// import { createMaintenanceSchema, getMaintenanceSchema } from './maintenance.validation.js';
//
// const router = Router();
//
// router.use(authMiddleware);
// router.post('/', roleMiddleware(['ADMIN', 'MINER']), validate(createMaintenanceSchema), createMaintenanceHandler);
// router.get('/:ballMillId', roleMiddleware(['ADMIN', 'MINER']), validate(getMaintenanceSchema), getMaintenanceHandler);
//
// export default router;