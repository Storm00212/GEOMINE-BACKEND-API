// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { Request, Response, NextFunction } from 'express';
// import { getDashboardSummary } from './dashboard.service.js';
//
// export const getDashboardHandler = async (_req: Request, res: Response, next: NextFunction) => {
//   try {
//     const summary = await getDashboardSummary();
//     res.status(200).json(summary);
//   } catch (error) {
//     next(error);
//   }
// };