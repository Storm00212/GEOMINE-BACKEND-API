// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { prisma } from '@config/database';
//
// export const getDashboardSummary = async () => {
//   const ballMillCount = await prisma.ballMill.count();
//   const latestReadings = await prisma.sensorReading.findMany({
//     orderBy: { timestamp: 'desc' },
//     take: 20,
//   });
//   const maintenanceCount = await prisma.maintenanceEvent.count();
//   const alertCount = await prisma.alert.count();
//
//   return {
//     ballMillCount,
//     maintenanceCount,
//     alertCount,
//     latestReadings,
//   };
// };