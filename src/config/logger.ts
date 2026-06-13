// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import express, { Request, Response, NextFunction } from 'express';
// import winston from 'winston';
// import { config } from './env.js';
//
// // Configure logger formatting for local console output,
// // while preserving structured JSON output for non-console transports.
// const consoleFormat = winston.format.combine(
//   winston.format.colorize(),
//   winston.format.timestamp(),
//   winston.format.printf(({ level, message, timestamp }) => `${timestamp} [${level}]: ${message}`),
// );
//
// export const logger = winston.createLogger({
//   level: config.logLevel,
//   format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
//   transports: [new winston.transports.Console({ format: consoleFormat })],
// });
//
// // Simple request logger middleware used by the Express app.
// export const requestLogger = (req: Request, _res: Response, next: NextFunction) => {
//   logger.info(`${req.method} ${req.originalUrl}`);
//   next();
// };