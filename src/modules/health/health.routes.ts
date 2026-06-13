// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { Router } from 'express';
// import { authMiddleware } from '@middleware/auth.middleware.js';
// import { roleMiddleware } from '@middleware/role.middleware.js';
// import { getHealthHandler } from './health.controller.js';
//
// const router = Router();
//
// router.use(authMiddleware);
// router.get('/:ballMillId', roleMiddleware(['ADMIN', 'MINER']), getHealthHandler);
//
// export default router;