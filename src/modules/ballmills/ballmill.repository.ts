// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { prisma } from '@config/database';
//
// export const getAllBallMills = () => prisma.ballMill.findMany();
// export const getBallMillById = (id: string) => prisma.ballMill.findUnique({ where: { id } });
// export const createBallMill = (data: { name: string; location: string; status: string; installedDate: string }) =>
//   prisma.ballMill.create({ data });
// export const updateBallMill = (id: string, data: Partial<{ name: string; location: string; status: string; installedDate: string }>) =>
//   prisma.ballMill.update({ where: { id }, data });