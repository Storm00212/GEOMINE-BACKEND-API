// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import { prisma } from '@config/database';
//
// export const createMaintenanceEvent = (data: {
//   ballMillId: string;
//   eventType: string;
//   notes?: string;
//   performedBy: string;
//   maintenanceDate: string;
// }) => prisma.maintenanceEvent.create({ data });
//
// export const getMaintenanceForBallMill = (ballMillId: string) =>
//   prisma.maintenanceEvent.findMany({ where: { ballMillId }, orderBy: { maintenanceDate: 'desc' } });