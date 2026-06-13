// FILE PURPOSE:
// - Handles incoming HTTP requests for the auth module and forwards them to service logic.
//
// NOTE: This file currently contains paused implementation code for team review.
//

// import { Request, Response, NextFunction } from 'express';
// import { login, register } from './auth.service.js';
//
// export const loginHandler = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { email, password } = req.body;
//     const result = await login(email, password);
//     res.status(200).json(result);
//   } catch (error) {
//     next(error);
//   }
// };
//
// export const registerHandler = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { name, email, password, role } = req.body;
//     const result = await register(name, email, password, role);
//     res.status(201).json(result);
//   } catch (error) {
//     next(error);
//   }
// };