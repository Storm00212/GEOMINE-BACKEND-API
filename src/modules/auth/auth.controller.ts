// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
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