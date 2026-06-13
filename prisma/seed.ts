// FILE PURPOSE:
// - Seeds the database with initial sample data and users.
//
// NOTE: This file currently contains paused implementation code for team review.
//

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);

  await prisma.user.createMany({
    data: [
      {
        name: 'Admin User',
        email: 'admin@geomine.local',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
      {
        name: 'Miner User',
        email: 'miner@geomine.local',
        passwordHash,
        role: 'MINER',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });