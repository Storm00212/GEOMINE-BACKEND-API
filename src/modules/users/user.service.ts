// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { createUser as createUserRepo, getAllUsers, getUserById, updateUser as updateUserRepo } from './user.repository.js';
// import { hashPassword } from '@shared/utils/hash.util.js';
// import { HttpError } from '@shared/errors/http.error.js';
//
// export const listUsers = () => getAllUsers();
// export const getUser = async (id: string) => {
//   const user = await getUserById(id);
//   if (!user) {
//     throw new HttpError(404, 'User not found');
//   }
//   return user;
// };
//
// export const createUser = async (name: string, email: string, password: string, role: string) => {
//   const passwordHash = await hashPassword(password);
//   return createUserRepo({ name, email, passwordHash, role });
// };
//
// export const updateUser = async (id: string, payload: Partial<{ name: string; email: string; password: string; role: string; isActive: boolean }>) => {
//   const data: any = { ...payload };
//   if (payload.password) {
//     data.passwordHash = await hashPassword(payload.password);
//     delete data.password;
//   }
//   return updateUserRepo(id, data);
// };