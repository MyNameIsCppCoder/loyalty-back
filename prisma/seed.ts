import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  // Создаем несколько тарифов
  await prisma.tarrif.createMany({
    data: [
      { name: 'Basic', price: 1000, maxClient: 100 },
      { name: 'Pro', price: 5000, maxClient: 500 },
      { name: 'Enterprise', price: 10000, maxClient: 1000 },
    ],
    skipDuplicates: true, // Если записи уже существуют, пропустите их
  });

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

    // Создание ролей для пользователей
    await prisma.userRole.createMany({
      data: [
        {
          userId: user.id,
          roleId: 1, // Допустим, что 1 - это роль 'user'
        },
        {
          userId: user.id,
          roleId: faker.number.int({ min: 2, max: 3 }), // Генерируем случайную роль для пользователя
        },
      ],
    });

    // Генерация клиентов и связанных данных для каждого пользователя
    for (let j = 0; j < 5; j++) {
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
          userId: user.id,
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
          },
        });

        // Генерация кэшбэка для клиента
        await prisma.cashBackTransaction.create({
          data: {
            clientId: client.id,
            amount: faker.number.int({ min: 10, max: 100 }),
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
