// FILE PURPOSE:
// - Implements business logic for the health module.
//
// NOTE: This file currently contains paused implementation code for team review.
//

// import { calculateHealthScore } from './health-calculator.js';
// import { getSensorReadingsForBallMill } from '@modules/sensors/sensor.repository.js';
// import { HttpError } from '@shared/errors/http.error.js';
//
// export const getHealthForBallMill = async (ballMillId: string) => {
//   const readings = await getSensorReadingsForBallMill(ballMillId);
//   if (!readings.length) {
//     throw new HttpError(404, 'No sensor readings found');
//   }
//
//   const latest = readings[0];
//   const result = calculateHealthScore(latest.currentAmp, latest.temperature, latest.runtimeHours);
//
//   return {
//     ballMillId,
//     latestReading: latest,
//     health: result,
//   };
// };