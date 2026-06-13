// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { NextFunction, Request, Response } from 'express';
// import { logger } from '@config/logger';
//
// export const errorMiddleware = (err: any, _req: Request, res: Response, _next: NextFunction) => {
//   logger.error(err?.message ?? 'Unknown error');
//
//   const status = err?.status ?? 500;
//   const message = err?.message ?? 'Internal server error';
//
//   res.status(status).json({ status: 'error', message });
// };