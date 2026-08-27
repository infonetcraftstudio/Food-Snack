import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);
  await db.user.upsert({
    where: { employeeId: 'EMP001' },
    update: { passwordHash, role: Role.EMPLOYEE, fullName: 'Alex Morgan', isActive: true },
    create: {
      employeeId: 'EMP001',
      fullName: 'Alex Morgan',
      passwordHash,
      role: Role.EMPLOYEE,
      department: 'Engineering',
      designation: 'Software Engineer',
    },
  });
  await db.user.deleteMany({ where: { role: { in: [Role.ADMIN, Role.MANAGEMENT, Role.FOOD_COLLECTION_STAFF] } } });
  console.log('Seeded employee account EMP001. Privileged pages use endpoint passwords.');
  console.log('No shifts were created by design.');
}

main().finally(() => db.$disconnect());
