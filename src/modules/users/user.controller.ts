// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { Request, Response, NextFunction } from 'express';
// import { createUser, getUser, listUsers, updateUser } from './user.service.js';
//
// export const getUsersHandler = async (_req: Request, res: Response, next: NextFunction) => {
//   try {
//     const users = await listUsers();
//     res.status(200).json(users);
//   } catch (error) {
//     next(error);
//   }
// };
//
// export const getUserHandler = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const user = await getUser(req.params.id);
//     res.status(200).json(user);
//   } catch (error) {
//     next(error);
//   }
// };
//
// export const createUserHandler = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { name, email, password, role } = req.body;
//     const user = await createUser(name, email, password, role);
//     res.status(201).json(user);
//   } catch (error) {
//     next(error);
//   }
// };
//
// export const updateUserHandler = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const user = await updateUser(req.params.id, req.body);
//     res.status(200).json(user);
//   } catch (error) {
//     next(error);
//   }
// };