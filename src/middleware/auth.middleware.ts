// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { NextFunction, Request, Response } from 'express';
// import { verifyJwt } from '@shared/utils/jwt.util';
//
// export interface AuthRequest extends Request {
//   user?: { userId: string; role: string };
// }
//
// // Authentication middleware that validates a Bearer JWT and attaches user info to the request.
// export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader?.startsWith('Bearer ')) {
//     return res.status(401).json({ message: 'Missing authorization header' });
//   }
//
//   const token = authHeader.split(' ')[1];
//
//   try {
//     const payload = verifyJwt(token);
//     req.user = payload;
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: 'Invalid or expired token' });
//   }
// };