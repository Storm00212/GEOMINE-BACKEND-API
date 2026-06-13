// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { Request, Response, NextFunction } from 'express';
// import { listAlerts } from './alert.service.js';
//
// export const getAlertsHandler = async (_req: Request, res: Response, next: NextFunction) => {
//   try {
//     const alerts = await listAlerts();
//     res.status(200).json(alerts);
//   } catch (error) {
//     next(error);
//   }
// };