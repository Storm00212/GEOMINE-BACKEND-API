// FILE PURPOSE:
// - Handles database access for the sensors module using Prisma.
//
// NOTE: This file currently contains paused implementation code for team review.
//

// import { prisma } from '@config/database';
//
// export const createSensorReading = (data: {
//   ballMillId: string;
//   currentAmp: number;
//   temperature: number;
//   runtimeHours: number;
//   timestamp: string;
// }) => prisma.sensorReading.create({ data });
//
// export const getSensorReadingsForBallMill = (ballMillId: string) =>
//   prisma.sensorReading.findMany({
//     where: { ballMillId },
//     orderBy: { timestamp: 'desc' },
//   });