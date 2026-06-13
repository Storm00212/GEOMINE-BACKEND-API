// FILE PURPOSE:
// - Handles runtime errors and formats JSON error responses.
//
// NOTE: This file currently contains paused implementation code for team review.
//

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