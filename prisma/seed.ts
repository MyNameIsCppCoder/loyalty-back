import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { hash } from 'argon2';

const prisma = new PrismaClient();

async function main() {



  // Создаем несколько тарифов
  await prisma.tarrif.createMany({
    data: [
      { name: 'freemium', price: 0, maxClient: 30 },
      { name: 'medium', price: 500, maxClient: 150 },
      { name: 'max', price: 1000, maxClient: 1000 },
      { name: 'admin', price: 0, maxClient: 10000 },
    ],
    skipDuplicates: true, // Если записи уже существуют, пропустите их
  });

  const adminTarrif = await prisma.tarrif.findFirst({ where: {name: 'admin' } });

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
      { roleName: 'user', id: 1, description: 'Person that able to immerse with clients' },
      { roleName: 'manager', id: 2, description: 'Person that able to immerse with clients and managers' },
      { roleName: 'admin', id: 3, description: 'admin role' },
    ],
    skipDuplicates: true,
  })

  await prisma.userRole.createMany({
    data: [
      {userId: admin.id, roleId: 1},
      {userId: admin.id, roleId: 3},
    ],
    skipDuplicates: true,
  })

  const tariffIds = await prisma.tarrif.findMany({
    select: { id: true },
  });

  // Генерация пользователей
  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.create({
      data: {
        username: faker.internet.userName(),
        name: faker.person.fullName(),
        passwordHash: faker.internet.password(),
        email: faker.internet.email(),
        tarrifId: faker.helpers.arrayElement(tariffIds).id, // Выбираем случайный тариф
      },
    });

    // Генерация клиентов и связанных данных для каждого пользователя
    for (let j = 0; j < 100; j++) {
      const client = await prisma.client.create({
        data: {
          name: faker.person.fullName(),
          phone: faker.phone.number(),
          email: faker.internet.email(),
          birthDate: faker.date.past({ years: 30 }),
          cashbackPercentage: faker.number.int({ min: 0, max: 20 }),
        },
      });

      // Связывание клиентов и пользователей
      await prisma.userClient.create({
        data: {
          userId: admin.id,
          clientId: client.id,
        },
      });

      // Создание транзакций покупок и посещений для клиента
      for (let k = 0; k < 3; k++) {
        const visit = await prisma.visit.create({
          data: {
            clientId: client.id,
            visitDate: faker.date.recent(),
          },
        });

        await prisma.purchase.create({
          data: {
            userId: user.id,
            clientId: client.id,
            visitId: visit.id,
            amount: faker.number.int({ min: 100, max: 1000 }),
            createdAt: faker.date.between({
              from: '2000-01-01',
              to: Date.now(),
            }),
          },
        });

        // Генерация кэшбэка для клиента
        await prisma.cashBackTransaction.create({
          data: {
            clientId: client.id,
            amount: faker.number.int({ min: 10, max: 100000 }),
          },
        });
      }
    }
  }

  console.log('Database has been seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
