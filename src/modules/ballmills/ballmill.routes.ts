// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { Router } from 'express';
// import { authMiddleware } from '@middleware/auth.middleware.js';
// import { roleMiddleware } from '@middleware/role.middleware.js';
// import { validate } from '@shared/validators/zod.middleware.js';
// import { createBallMillHandler, getBallMillHandler, getBallMillsHandler, updateBallMillHandler } from './ballmill.controller.js';
// import { createBallMillSchema, getBallMillSchema, updateBallMillSchema } from './ballmill.validation.js';
//
// const router = Router();
//
// router.use(authMiddleware);
// router.get('/', roleMiddleware(['ADMIN', 'MINER']), getBallMillsHandler);
// router.get('/:id', roleMiddleware(['ADMIN', 'MINER']), validate(getBallMillSchema), getBallMillHandler);
// router.post('/', roleMiddleware(['ADMIN']), validate(createBallMillSchema), createBallMillHandler);
// router.put('/:id', roleMiddleware(['ADMIN']), validate(updateBallMillSchema), updateBallMillHandler);
//
// export default router;