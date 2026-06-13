// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { Request, Response, NextFunction } from 'express';
// import { ZodError } from 'zod';
//
// export const validationMiddleware = (err: unknown, _req: Request, res: Response, next: NextFunction) => {
//   if (err instanceof ZodError) {
//     return res.status(400).json({ message: 'Validation failed', errors: err.flatten().fieldErrors });
//   }
//   next(err);
// };