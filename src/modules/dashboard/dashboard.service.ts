// FILE PURPOSE:
// - Implements business logic for the dashboard module.
//
// NOTE: This file currently contains paused implementation code for team review.
//

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