// FILE PURPOSE:
// - Initializes the Prisma database client used by the application.
//
// NOTE: This file currently contains paused implementation code for team review.
//

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();