// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { Request, Response, NextFunction } from 'express';
// import { getSummaryReport } from './report.service.js';
//
// export const getReportSummaryHandler = async (_req: Request, res: Response, next: NextFunction) => {
//   try {
//     const report = await getSummaryReport();
//     res.status(200).json(report);
//   } catch (error) {
//     next(error);
//   }
// };