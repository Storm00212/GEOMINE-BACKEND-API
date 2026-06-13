// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { createBallMill as createBallMillRepo, getAllBallMills, getBallMillById, updateBallMill as updateBallMillRepo } from './ballmill.repository.js';
// import { HttpError } from '@shared/errors/http.error.js';
//
// export const listBallMills = () => getAllBallMills();
// export const getBallMill = async (id: string) => {
//   const ballMill = await getBallMillById(id);
//   if (!ballMill) {
//     throw new HttpError(404, 'Ball mill not found');
//   }
//   return ballMill;
// };
//
// export const createBallMill = (data: { name: string; location: string; status: string; installedDate: string }) =>
//   createBallMillRepo(data);
//
// export const updateBallMill = async (id: string, data: Partial<{ name: string; location: string; status: string; installedDate: string }>) => {
//   const ballMill = await getBallMillById(id);
//   if (!ballMill) {
//     throw new HttpError(404, 'Ball mill not found');
//   }
//   return updateBallMillRepo(id, data);
// };