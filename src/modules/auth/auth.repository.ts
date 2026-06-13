// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { prisma } from '@config/database';
//
// export const findUserByEmail = (email: string) => prisma.user.findUnique({ where: { email } });
// export const findUserById = (id: string) => prisma.user.findUnique({ where: { id } });
// export const createUser = (data: { name: string; email: string; passwordHash: string; role: string }) =>
//   prisma.user.create({ data });