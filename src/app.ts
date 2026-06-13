// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import express from 'express';
// import cors from 'cors';
// import helmet from 'helmet';
// import compression from 'compression';
// import rateLimit from 'express-rate-limit';
// import { config } from '@config/env';
// import { logger, requestLogger } from '@config/logger';
// import { errorMiddleware } from '@middleware/error.middleware';
// import authRoutes from '@modules/auth/auth.routes';
// import userRoutes from '@modules/users/user.routes';
// import ballmillRoutes from '@modules/ballmills/ballmill.routes';
// import sensorRoutes from '@modules/sensors/sensor.routes';
// import healthRoutes from '@modules/health/health.routes';
// import predictionRoutes from '@modules/predictions/prediction.routes';
// import alertRoutes from '@modules/alerts/alert.routes';
// import maintenanceRoutes from '@modules/maintenance/maintenance.routes';
// import dashboardRoutes from '@modules/dashboard/dashboard.routes';
// import reportRoutes from '@modules/reports/report.routes';
//
// // Express application instance used to configure middleware and routes.
// const app = express();
//
// // Standard middleware for security, cross-origin access, payload handling, and logging.
// app.use(helmet());
// app.use(cors());
// app.use(compression());
// app.use(express.json());
// app.use(requestLogger);
//
// // Protect the API from abuse with a simple rate limiter.
// app.use(rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   standardHeaders: true,
//   legacyHeaders: false,
// }));
//
// // API route registration. Each module owns its own router and validation.
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/ballmills', ballmillRoutes);
// app.use('/api/sensors', sensorRoutes);
// app.use('/api/health', healthRoutes);
// app.use('/api/predictions', predictionRoutes);
// app.use('/api/alerts', alertRoutes);
// app.use('/api/maintenance', maintenanceRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/reports', reportRoutes);
//
// // Centralized error handling for all routes and middleware.
// app.use(errorMiddleware);
//
// // A lightweight health check endpoint that can be used by load balancers.
// app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
//
// export default app;