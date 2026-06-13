-- GEOMINE Ball Mill Health Monitoring System
-- PostgreSQL Database Schema (Generated from Prisma Schema)
-- This is a demonstration of what the database structure will look like

-- ============================================================================
-- USER TABLE - Stores system users (Admin and Miner roles)
-- ============================================================================
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "User_email_idx" ON "User"("email");

-- ============================================================================
-- BALLMILL TABLE - Stores ball mill equipment information
-- ============================================================================
CREATE TABLE "BallMill" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "status" VARCHAR(255) NOT NULL,
    "installedDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BallMill_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BallMill_name_idx" ON "BallMill"("name");
CREATE INDEX "BallMill_location_idx" ON "BallMill"("location");

-- ============================================================================
-- SENSORREADING TABLE - Stores sensor data (Current, Temperature, Runtime)
-- ============================================================================
CREATE TABLE "SensorReading" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ballMillId" UUID NOT NULL,
    "currentAmp" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "runtimeHours" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SensorReading_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SensorReading_ballMillId_fkey" FOREIGN KEY ("ballMillId") REFERENCES "BallMill"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "SensorReading_ballMillId_idx" ON "SensorReading"("ballMillId");
CREATE INDEX "SensorReading_timestamp_idx" ON "SensorReading"("timestamp");

-- ============================================================================
-- MAINTENANCEEVENT TABLE - Records maintenance actions performed
-- ============================================================================
CREATE TABLE "MaintenanceEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ballMillId" UUID NOT NULL,
    "eventType" VARCHAR(255) NOT NULL,
    "notes" TEXT,
    "performedBy" VARCHAR(255) NOT NULL,
    "maintenanceDate" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MaintenanceEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MaintenanceEvent_ballMillId_fkey" FOREIGN KEY ("ballMillId") REFERENCES "BallMill"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "MaintenanceEvent_ballMillId_idx" ON "MaintenanceEvent"("ballMillId");
CREATE INDEX "MaintenanceEvent_maintenanceDate_idx" ON "MaintenanceEvent"("maintenanceDate");

-- ============================================================================
-- PREDICTION TABLE - Stores maintenance predictions
-- ============================================================================
CREATE TABLE "Prediction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ballMillId" UUID NOT NULL,
    "riskLevel" VARCHAR(255) NOT NULL,
    "recommendedAction" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Prediction_ballMillId_fkey" FOREIGN KEY ("ballMillId") REFERENCES "BallMill"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Prediction_ballMillId_idx" ON "Prediction"("ballMillId");
CREATE INDEX "Prediction_createdAt_idx" ON "Prediction"("createdAt");

-- ============================================================================
-- ALERT TABLE - Stores system alerts
-- ============================================================================
CREATE TABLE "Alert" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ballMillId" UUID NOT NULL,
    "severity" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Alert_ballMillId_fkey" FOREIGN KEY ("ballMillId") REFERENCES "BallMill"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Alert_ballMillId_idx" ON "Alert"("ballMillId");
CREATE INDEX "Alert_severity_idx" ON "Alert"("severity");
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt");

-- ============================================================================
-- SAMPLE DATA - Example queries to understand the data flow
-- ============================================================================

-- Example: Register a user (Admin)
-- INSERT INTO "User" (name, email, "passwordHash", role, "isActive")
-- VALUES (
--   'Admin User',
--   'admin@geomine.local',
--   '$2a$12$hash...', -- bcrypt hash
--   'ADMIN',
--   true
-- );

-- Example: Register a ball mill
-- INSERT INTO "BallMill" (name, location, status, "installedDate")
-- VALUES (
--   'Ball Mill 001',
--   'Mining Site A - Section 2',
--   'OPERATIONAL',
--   '2024-01-15 10:00:00'
-- );

-- Example: Record a sensor reading
-- INSERT INTO "SensorReading" ("ballMillId", "currentAmp", "temperature", "runtimeHours", timestamp)
-- VALUES (
--   'uuid-of-ball-mill',
--   52.3,
--   72.1,
--   245.5,
--   CURRENT_TIMESTAMP
-- );

-- Example: Record maintenance
-- INSERT INTO "MaintenanceEvent" ("ballMillId", "eventType", notes, "performedBy", "maintenanceDate")
-- VALUES (
--   'uuid-of-ball-mill',
--   'GREASING',
--   'Applied high-temperature grease to main bearing',
--   'John Smith',
--   CURRENT_TIMESTAMP
-- );

-- Example: Create an alert
-- INSERT INTO "Alert" ("ballMillId", severity, message, "isRead")
-- VALUES (
--   'uuid-of-ball-mill',
--   'WARNING',
--   'Temperature exceeds safe threshold',
--   false
-- );

-- ============================================================================
-- USEFUL QUERIES
-- ============================================================================

-- Get latest sensor reading for a ball mill
-- SELECT * FROM "SensorReading"
-- WHERE "ballMillId" = 'uuid'
-- ORDER BY timestamp DESC
-- LIMIT 1;

-- Get health metrics (last 24 hours)
-- SELECT
--   DATE_TRUNC('hour', timestamp) as hour,
--   AVG("currentAmp") as avg_current,
--   AVG(temperature) as avg_temp,
--   MAX(temperature) as max_temp,
--   MIN(temperature) as min_temp
-- FROM "SensorReading"
-- WHERE "ballMillId" = 'uuid' AND timestamp >= NOW() - INTERVAL '24 hours'
-- GROUP BY DATE_TRUNC('hour', timestamp)
-- ORDER BY hour DESC;

-- Get recent maintenance history
-- SELECT * FROM "MaintenanceEvent"
-- WHERE "ballMillId" = 'uuid'
-- ORDER BY "maintenanceDate" DESC
-- LIMIT 10;

-- Get unread alerts
-- SELECT * FROM "Alert"
-- WHERE "isRead" = false
-- ORDER BY "createdAt" DESC;

-- Get critical alerts in last 7 days
-- SELECT * FROM "Alert"
-- WHERE severity = 'CRITICAL' AND "createdAt" >= NOW() - INTERVAL '7 days'
-- ORDER BY "createdAt" DESC;

-- Count total readings per ball mill
-- SELECT "ballMillId", COUNT(*) as reading_count
-- FROM "SensorReading"
-- GROUP BY "ballMillId"
-- ORDER BY reading_count DESC;
