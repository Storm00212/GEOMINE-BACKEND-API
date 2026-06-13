// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { Router } from 'express';
// import { authMiddleware } from '@middleware/auth.middleware.js';
// import { roleMiddleware } from '@middleware/role.middleware.js';
// import { validate } from '@shared/validators/zod.middleware.js';
// import { createUserHandler, getUsersHandler, getUserHandler, updateUserHandler } from './user.controller.js';
// import { createUserSchema, getUserSchema, updateUserSchema } from './user.validation.js';
//
// const router = Router();
//
// router.use(authMiddleware);
// router.get('/', roleMiddleware(['ADMIN']), getUsersHandler);
// router.get('/:id', roleMiddleware(['ADMIN']), validate(getUserSchema), getUserHandler);
// router.post('/', roleMiddleware(['ADMIN']), validate(createUserSchema), createUserHandler);
// router.put('/:id', roleMiddleware(['ADMIN']), validate(updateUserSchema), updateUserHandler);
//
// export default router;