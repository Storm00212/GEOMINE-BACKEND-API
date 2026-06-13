// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { prisma } from '@config/database';
//
// export const getAllUsers = () => prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true } });
// export const getUserById = (id: string) => prisma.user.findUnique({ where: { id } });
// export const createUser = (data: { name: string; email: string; passwordHash: string; role: string }) =>
//   prisma.user.create({ data });
// export const updateUser = (id: string, data: Partial<{ name: string; email: string; passwordHash: string; role: string; isActive: boolean }>) =>
//   prisma.user.update({ where: { id }, data });