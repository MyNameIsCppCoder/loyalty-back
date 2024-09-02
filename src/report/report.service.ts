import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { parse, format } from 'date-fns';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllClientIds(userId: number) {
    return this.prisma.userClient
      .findMany({
        where: {
          userId,
        },
        select: { clientId: true },
      })
      .then((clients) => clients.map((client) => client.clientId));
  }
  validateDate(startDate: string, endDate: string, daysGone: number) {
    if (startDate && endDate) {
      const parsedStartDate = format(
        parse(startDate, 'dd-MM-yyyy', new Date()),
        'yyyy-MM-dd',
      );
      const parsedEndDate = format(
        parse(endDate, 'dd-MM-yyyy', new Date()),
        'yyyy-MM-dd',
      );

      if (parsedStartDate >= parsedEndDate) {
        throw new ConflictException('Start bigger or equal than end');
      }
      if (startDate && endDate && daysGone) {
        throw new ConflictException(
          'startDate, endDate and daysGone are conflict',
        );
      }
    }
  }

  async createDateFilter(
    daysGone: number,
    startDate?: string,
    endDate?: string,
  ) {
    let dateFilter: any = {};

    if (startDate && endDate) {
      const parsedStartDate = parse(startDate, 'dd-MM-yyyy', new Date());
      const parsedEndDate = parse(endDate, 'dd-MM-yyyy', new Date());

      dateFilter = {
        createdAt: {
          gte: parsedStartDate,
          lte: parsedEndDate,
        },
      };
    } else if (daysGone > 0) {
      const daysAgoDate = new Date();
      daysAgoDate.setDate(daysAgoDate.getDate() - daysGone);

      dateFilter = {
        createdAt: {
          gte: daysAgoDate,
        },
      };
    }

    return dateFilter;
  }

  async getAverageOrderValueByClient(
    userId: number,
    clientId: number,
    daysGone: number = 0,
    startDate?: string, // Формат DD-MM-YYYY
    endDate?: string, // Формат DD-MM-YYYY
  ) {
    this.validateDate(startDate, endDate, daysGone);
    const dateFilter: any = await this.createDateFilter(
      daysGone,
      startDate,
      endDate,
    );

    const result = await this.prisma.purchase.aggregate({
      where: {
        clientId: clientId,
        client: {
          userClient: {
            some: {
              userId: userId,
            },
          },
        },
        ...dateFilter,
      },
      _avg: {
        amount: true,
      },
    });

    return result._avg.amount || 0;
  }

  async getAverageOrderValueByAllClient(
    userId: number,
    daysGone: number = 0,
    startDate?: string, // Формат DD-MM-YYYY
    endDate?: string, // Формат DD-MM-YYYY
  ) {
    this.validateDate(startDate, endDate, daysGone);
    const dateFilter: any = await this.createDateFilter(
      daysGone,
      startDate,
      endDate,
    );

    // Сначала получаем IDs клиентов, связанных с пользователем
    const clientIds = await this.getAllClientIds(userId);

    if (clientIds.length === 0) {
      return 0; // Если нет клиентов, возвращаем 0
    }

    // Затем используем эти IDs в агрегатном запросе
    const result = await this.prisma.purchase.aggregate({
      where: {
        clientId: {
          in: clientIds,
        },
        ...dateFilter,
      },
      _avg: {
        amount: true,
      },
    });

    return result._avg.amount || 0;
  }

  async getActiveClientByMentionedDay(
    userId: number,
    daysGone: number = 0,
    startDate?: string,
    endDate?: string,
  ) {
    // Валидация входных параметров
    this.validateDate(startDate, endDate, daysGone);

    // Создаем фильтр для даты
    const dateFilter = await this.createDateFilter(
      daysGone,
      startDate,
      endDate,
    );
    // Получаем общее количество клиентов и количество активных клиентов
    const activeClientIds = await this.prisma.purchase
      .findMany({
        where: {
          ...dateFilter,
        },
        select: {
          clientId: true,
        },
        distinct: ['clientId'],
      })
      .then((purchases) => purchases.map((purchase) => purchase.clientId));

    // Получаем общее количество клиентов
    const totalClient = await this.prisma.userClient.count({
      where: {
        userId: userId,
      },
    });

    // Получаем количество активных клиентов
    const activeClient = await this.prisma.userClient.count({
      where: {
        userId: userId,
        clientId: {
          in: activeClientIds,
        },
      },
    });

    const percentActiveClient =
      totalClient > 0 ? (activeClient / totalClient) * 100 : 0;

    return {
      totalClient,
      activeClient,
      percentActiveClient,
    };
  }

  async getCohortAnalysis(
    userId: number,
    daysGone: number = 0,
    startDate?: string,
    endDate?: string,
  ) {
    // Создаем фильтр для даты на основе введенных параметров
    const dateFilter = await this.createDateFilter(
      daysGone,
      startDate,
      endDate,
    );

    // Сначала получаем список clientId, связанных с пользователем
    const clientIds = await this.getAllClientIds(userId);

    // Затем используем этот список в запросе для получения покупок
    const purchases = await this.prisma.purchase.findMany({
      where: {
        clientId: {
          in: clientIds,
        },
        ...dateFilter, // Применяем фильтр по дате
      },
      select: {
        createdAt: true,
      },
    });

    // Группируем покупки по месяцам и считаем количество
    const cohorts = purchases.reduce(
      (acc, purchase) => {
        const month = format(purchase.createdAt, 'yyyy-MM');
        if (!acc[month]) {
          acc[month] = 0;
        }
        acc[month] += 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Преобразуем результат в нужный формат
    return Object.entries(cohorts).map(([cohort, purchaseCount]) => ({
      cohort,
      purchaseCount,
    }));
  }

  async getRepeatPurchaseRate(
    userId: number,
    daysGone: number = 0,
    startDate?: string,
    endDate?: string,
  ) {
    // Создаем фильтр для даты на основе введенных параметров
    const dateFilter = await this.createDateFilter(
      daysGone,
      startDate,
      endDate,
    );

    const clientIds = await this.getAllClientIds(userId);
    // Получаем идентификаторы клиентов, совершивших более одной покупки за указанный период
    const repeatClients = await this.prisma.purchase.groupBy({
      by: ['clientId'],
      where: {
        clientId: {
          in: clientIds,
        },
        ...dateFilter,
      },
      having: {
        clientId: {
          _count: {
            gt: 1,
          },
        },
      },
      _count: {
        clientId: true,
      },
    });

    const repeatClientCount = repeatClients.length;

    // Общее количество клиентов
    const totalClientCount = await this.prisma.userClient.count({
      where: {
        userId: userId,
      },
    });

    return {
      repeatClientCount,
      totalClientCount,
    };
  }

  async getChurnRate(
    userId: number,
    daysGone: number = 0,
    startDate?: string, // Формат DD-MM-YYYY
    endDate?: string, // Формат DD-MM-YYYY
  ) {
    // Формируем условие для фильтрации по дате
    const dateFilter: any = this.createDateFilter(daysGone, startDate, endDate);
    this.validateDate(startDate, endDate, daysGone);
    // Получаем список активных клиентов за указанный период
    const activeClients = await this.prisma.purchase.findMany({
      where: {
        ...dateFilter,
        client: {
          userClient: {
            some: {
              userId: userId,
            },
          },
        },
      },
      select: {
        clientId: true,
      },
      distinct: ['clientId'],
    });

    const activeClientIds = activeClients.map((client) => client.clientId);

    // Общее количество клиентов пользователя
    const totalClientCount = await this.prisma.userClient.count({
      where: {
        userId: userId,
      },
    });

    // Количество клиентов, которые не активны (не делали покупок за указанный период)
    const churnedClientCount = await this.prisma.userClient.count({
      where: {
        userId: userId,
        clientId: {
          notIn: activeClientIds,
        },
      },
    });

    return {
      totalClientCount,
      churnedClientCount,
    };
  }

  async getCustomerLifetimeValue(
    userId: number,
    daysGone: number = 0,
    startDate?: string,
    endDate?: string,
  ) {
    this.validateDate(startDate, endDate, daysGone);
    const dateFilter = await this.createDateFilter(
      daysGone,
      startDate,
      endDate,
    );

    const clientIds = await this.getAllClientIds(userId);
    // Получаем значения суммы покупок для каждого клиента, связанного с пользователем
    const lifetimeValues = await this.prisma.purchase.groupBy({
      by: ['clientId'],
      where: {
        clientId: {
          in: clientIds,
        },
        ...dateFilter,
        amount: { gt: 0 },
      },
      _sum: {
        amount: true,
      },
    });

    // Преобразуем результат в нужный формат
    return lifetimeValues.map((entry) => ({
      clientId: entry.clientId,
      lifetimeValue: entry._sum.amount || 0,
    }));
  }

  async getCustomerActivityDays(
    userId: number,
    daysGone: number = 0,
    startDate?: string,
    endDate?: string,
  ) {
    // Создаем фильтр для даты на основе введенных параметров
    const dateFilter = await this.createDateFilter(
      daysGone,
      startDate,
      endDate,
    );
    this.validateDate(startDate, endDate, daysGone);

    const dateCondition = dateFilter.created_at
      ? `AND created_at BETWEEN '${dateFilter.created_at.gte}' AND '${dateFilter.created_at.lte}'`
      : '';

    const result = await this.prisma.$queryRaw<
      { clientId: number; activeDays: number }[]
    >`
      SELECT
        client_id AS "clientId",
        COUNT(DISTINCT DATE(created_at)) AS "activeDays"
      FROM purchases
      WHERE client_id IN (
        SELECT client_id
        FROM user_clients
        WHERE user_id = ${userId}
      )
      ${Prisma.raw(dateCondition)}
      GROUP BY client_id;
    `;

    return result.map((entry) => ({
      clientId: Number(entry.clientId),
      activeDays: Number(entry.activeDays),
    }));
  }

  async getAveragePurchaseFrequency(
    userId: number,
    daysGone: number = 0,
    startDate?: string,
    endDate?: string,
  ) {
    this.validateDate(startDate, endDate, daysGone);
    const dateFilter = await this.createDateFilter(
      daysGone,
      startDate,
      endDate,
    );

    const clientIds = await this.getAllClientIds(userId);
    // Получаем количество покупок для каждого клиента
    const purchaseCounts = await this.prisma.purchase.groupBy({
      by: ['clientId'],
      where: {
        clientId: {
          in: clientIds,
        },
        ...dateFilter, // Добавляем фильтр по дате
      },
      _count: {
        clientId: true,
      },
    });

    // Рассчитываем частоту покупок
    return purchaseCounts.map((purchase) => ({
      clientId: purchase.clientId,
      purchaseFrequency:
        purchase._count.clientId / (daysGone > 0 ? daysGone : 1),
    }));
  }

  async calculateClientMetrics(
    userId: number,
    daysGone?: number,
    startDate?: string,
    endDate?: string,
  ) {
    const [
      averagePurchaseFrequency,
      customerActivityDays,
      customerLifetimeValue,
      churnRate,
      repeatPurchaseRate,
      activeClientByMentionedDay,
      averageOrderValueByAllClient,
    ] = await Promise.all([
      this.getAveragePurchaseFrequency(userId, daysGone, startDate, endDate),
      this.getCustomerActivityDays(userId, daysGone, startDate, endDate),
      this.getCustomerLifetimeValue(userId, daysGone, startDate, endDate),
      this.getChurnRate(userId, daysGone, startDate, endDate),
      this.getRepeatPurchaseRate(userId, daysGone, startDate, endDate),
      this.getActiveClientByMentionedDay(userId, daysGone, startDate, endDate),
      this.getAverageOrderValueByAllClient(
        userId,
        daysGone,
        startDate,
        endDate,
      ),
    ]);

    return {
      averagePurchaseFrequency,
      customerActivityDays,
      customerLifetimeValue,
      churnRate,
      repeatPurchaseRate,
      activeClientByMentionedDay,
      averageOrderValueByAllClient,
    };
  }
}
