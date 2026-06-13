// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { prisma } from '@config/database';
//
// export const getSummaryReport = async () => {
//   const totalBallMills = await prisma.ballMill.count();
//   const totalSensors = await prisma.sensorReading.count();
//   const totalMaintenance = await prisma.maintenanceEvent.count();
//   const criticalAlerts = await prisma.alert.count({ where: { severity: 'CRITICAL' } });
//
//   return {
//     totalBallMills,
//     totalSensors,
//     totalMaintenance,
//     criticalAlerts,
//   };
// };