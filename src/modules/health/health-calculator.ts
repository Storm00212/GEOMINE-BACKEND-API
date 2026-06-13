// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// export type HealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';
//
// export const calculateHealthScore = (currentAmp: number, temperature: number, runtimeHours: number) => {
//   let penalty = 0;
//
//   if (temperature >= 65 && temperature <= 75) {
//     penalty += 10;
//   } else if (temperature > 75) {
//     penalty += 30;
//   }
//
//   if (runtimeHours >= 200 && runtimeHours <= 300) {
//     penalty += 10;
//   } else if (runtimeHours > 300) {
//     penalty += 20;
//   }
//
//   if (currentAmp > 55) {
//     penalty += 15;
//   }
//
//   const score = Math.max(0, 100 - penalty);
//   const status: HealthStatus = score >= 80 ? 'HEALTHY' : score >= 60 ? 'WARNING' : 'CRITICAL';
//
//   return { score, status };
// };