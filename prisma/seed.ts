import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { hash } from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // Создаем несколько тарифов
  await prisma.tarrif.createMany({
    data: [
      { name: 'freemium', price: 0, maxClient: 30, id: 1 },
      { name: 'medium', price: 500, maxClient: 150, id: 2 },
      { name: 'max', price: 1000, maxClient: 1000, id: 3 },
      { name: 'admin', price: 0, maxClient: 10000, id: 4 },
    ],
    skipDuplicates: true,
  });

  const adminTarrif = await prisma.tarrif.findFirst({
    where: { name: 'admin' },
  });

  const admin = await prisma.user.create({
    data: {
      username: 'Vladimirus',
      name: 'Vladimir',
      email: 'kasterinvladimir@gmail.com',
      passwordHash: await hash('443412Vova'),
      tarrifId: adminTarrif.id,
    },
  });

  await prisma.role.createMany({
    data: [
      {
        roleName: 'user',
        id: 1,
        description: 'Person that able to immerse with clients',
      },
      {
        roleName: 'manager',
        id: 2,
        description: 'Person that able to immerse with clients and managers',
      },
      { roleName: 'admin', id: 3, description: 'admin role' },
    ],
    skipDuplicates: true,
  });

  await prisma.userRole.createMany({
    data: [
      { userId: admin.id, roleId: 1 },
      { userId: admin.id, roleId: 3 },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
