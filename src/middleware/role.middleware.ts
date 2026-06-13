// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { NextFunction, Request, Response } from 'express';
// import { AuthRequest } from '@middleware/auth.middleware';
// import { Role } from '@shared/constants/roles';
//
// // Authorization middleware that checks user role permissions attached by authMiddleware.
// export const roleMiddleware = (roles: Role[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
//   const userRole = req.user?.role;
//   if (!userRole || !roles.includes(userRole as Role)) {
//     return res.status(403).json({ message: 'Forbidden' });
//   }
//   next();
// };