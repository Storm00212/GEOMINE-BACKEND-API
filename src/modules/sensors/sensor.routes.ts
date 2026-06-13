// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { Router } from 'express';
// import { authMiddleware } from '@middleware/auth.middleware.js';
// import { roleMiddleware } from '@middleware/role.middleware.js';
// import { validate } from '@shared/validators/zod.middleware.js';
// import { createSensorReadingHandler, getSensorReadingsHandler } from './sensor.controller.js';
// import { createSensorReadingSchema, getSensorReadingsSchema } from './sensor.validation.js';
//
// const router = Router();
//
// router.use(authMiddleware);
// router.post('/', roleMiddleware(['ADMIN', 'MINER']), validate(createSensorReadingSchema), createSensorReadingHandler);
// router.get('/:ballMillId', roleMiddleware(['ADMIN', 'MINER']), validate(getSensorReadingsSchema), getSensorReadingsHandler);
//
// export default router;