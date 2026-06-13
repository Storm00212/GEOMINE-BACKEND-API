// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { NextFunction, Request, Response } from 'express';
// import { AnyZodObject } from 'zod';
//
// export const validate = (schema: AnyZodObject) => (req: Request, _res: Response, next: NextFunction) => {
//   try {
//     schema.parse({ body: req.body, params: req.params, query: req.query });
//     next();
//   } catch (error) {
//     next(error);
//   }
// };