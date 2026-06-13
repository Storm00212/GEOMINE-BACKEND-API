// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
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