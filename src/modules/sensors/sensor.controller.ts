// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { Request, Response, NextFunction } from 'express';
// import { listSensorReadings, recordSensorReading } from './sensor.service.js';
//
// export const createSensorReadingHandler = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const reading = await recordSensorReading(req.body);
//     res.status(201).json(reading);
//   } catch (error) {
//     next(error);
//   }
// };
//
// export const getSensorReadingsHandler = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const readings = await listSensorReadings(req.params.ballMillId);
//     res.status(200).json(readings);
//   } catch (error) {
//     next(error);
//   }
// };