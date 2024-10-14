import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { parse, format, addMonths, isValid, subDays, differenceInCalendarDays } from 'date-fns';

@Injectable()
export class ReportService {
	constructor(private readonly prisma: PrismaService) { }

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
		if (startDate && endDate && daysGone) {
			throw new ConflictException(
				"startDate, endDate and daysGone are conflicting parameters",
			);
		}

		if (startDate && endDate) {
			const parsedStartDate = parse(startDate, "yyyy-MM-dd", new Date());
			const parsedEndDate = parse(endDate, "yyyy-MM-dd", new Date());

			if (!isValid(parsedStartDate) || !isValid(parsedEndDate)) {
				throw new BadRequestException("Invalid date format");
			}

			if (parsedStartDate >= parsedEndDate) {
				throw new ConflictException("Start date must be earlier than end date");
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
			const parsedStartDate = parse(startDate, "yyyy-MM-dd", new Date());
			const parsedEndDate = parse(endDate, "yyyy-MM-dd", new Date());

			if (!isValid(parsedStartDate) || !isValid(parsedEndDate)) {
				throw new BadRequestException("Invalid date format");
			}

			dateFilter = {
				createdAt: {
					gte: parsedStartDate,
					lte: parsedEndDate,
				},
			};
		} else if (daysGone && daysGone > 0) {
			const daysAgoDate = subDays(new Date(), daysGone);

			dateFilter = {
				createdAt: {
					gte: daysAgoDate,
				},
			};
		}

		return dateFilter;
	}


	parseDate(dateStr: string): Date {
		return parse(dateStr, 'yyyy-MM-dd', new Date());
	}

	async getAverageOrderValueByClient(
		userId: number,
		clientId: number,
		daysGone: number = 0,
		startDate?: string,
		endDate?: string,
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
		daysGone: number = 30,
		startDate?: string,
		endDate?: string,
	) {
		this.validateDate(startDate, endDate, daysGone);

		// Получаем IDs клиентов, связанных с пользователем
		const clientIds = await this.getAllClientIds(userId);

		if (clientIds.length === 0) {
			return []; // Если нет клиентов, возвращаем пустой массив
		}

		// Получаем дату первой покупки
		const firstPurchase = await this.prisma.purchase.findFirst({
			where: {
				clientId: {
					in: clientIds,
				},
			},
			orderBy: {
				createdAt: 'asc',
			},
			select: {
				createdAt: true,
			},
		});

		if (!firstPurchase) {
			return []; // Если нет покупок, возвращаем пустой массив
		}

		// Определяем начальную и конечную даты
		const start = startDate
			? new Date(startDate)
			: new Date(
				firstPurchase.createdAt.getFullYear(),
				firstPurchase.createdAt.getMonth(),
				1,
			);
		const end = endDate ? new Date(endDate) : new Date();

		// Создаем массив периодов (месяцев)
		const periods = [];
		const currentStart = new Date(start);

		while (currentStart <= end) {
			const periodStart = new Date(
				currentStart.getFullYear(),
				currentStart.getMonth(),
				1,
			);
			const periodEnd = new Date(
				currentStart.getFullYear(),
				currentStart.getMonth() + 1,
				1,
			);

			periods.push({
				start: periodStart,
				end: periodEnd,
			});

			// Переходим к следующему месяцу
			currentStart.setMonth(currentStart.getMonth() + 1);
		}

		// Получаем средний чек для каждого периода
		const results = [];

		for (const period of periods) {
			const avgResult = await this.prisma.purchase.aggregate({
				where: {
					clientId: {
						in: clientIds,
					},
					createdAt: {
						gte: period.start,
						lt: period.end,
					},
				},
				_avg: {
					amount: true,
				},
			});

			const key = `${period.start.getFullYear()}-${(period.start.getMonth() + 1)
				.toString()
				.padStart(2, '0')}`;

			results.push({
				[key]: avgResult._avg.amount || 0,
			});
		}

		return results;
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
	): Promise<{ [key: string]: number }[]> {
		// 1. Валидация дат
		this.validateDate(startDate, endDate, daysGone);

		// 2. Создание фильтра дат
		const dateFilter = await this.createDateFilter(
			daysGone,
			startDate,
			endDate,
		);

		// 3. Получение ID клиентов, связанных с пользователем
		const clientIds = await this.getAllClientIds(userId);

		if (clientIds.length === 0) {
			return []; // Если нет клиентов, возвращаем пустой массив
		}

		// 4. Получение даты первой покупки
		const firstPurchase = await this.prisma.purchase.findFirst({
			where: {
				clientId: {
					in: clientIds,
				},
				...dateFilter,
			},
			orderBy: {
				createdAt: 'asc',
			},
			select: {
				createdAt: true,
			},
		});

		if (!firstPurchase) {
			return []; // Если нет покупок, возвращаем пустой массив
		}

		// 5. Определение начальной и конечной дат
		const start = startDate
			? this.parseDate(startDate)
			: new Date(
				firstPurchase.createdAt.getFullYear(),
				firstPurchase.createdAt.getMonth(),
				1,
			);

		const end = endDate ? this.parseDate(endDate) : new Date(); // Текущая дата

		// 6. Создание массива периодов (месяцев)
		const periods: { start: Date; end: Date }[] = [];
		let currentStart = new Date(start.getFullYear(), start.getMonth(), 1);

		while (currentStart <= end) {
			const periodStart = new Date(
				currentStart.getFullYear(),
				currentStart.getMonth(),
				1,
			);
			const periodEnd = addMonths(periodStart, 1);

			periods.push({
				start: periodStart,
				end: periodEnd,
			});

			// Переход к следующему месяцу
			currentStart = addMonths(currentStart, 1);
		}

		// 7. Получение всех покупок в выбранном диапазоне
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

		// 8. Группировка покупок по месяцам и подсчет количества
		const cohorts: Record<string, number> = {};

		purchases.forEach((purchase) => {
			const month = format(purchase.createdAt, 'yyyy-MM');
			if (!cohorts[month]) {
				cohorts[month] = 0;
			}
			cohorts[month] += 1;
		});

		// 9. Формирование результатов с учетом всех месяцев и подсчет количества покупок
		const results: { [key: string]: number }[] = [];

		periods.forEach((period) => {
			const key = format(period.start, 'yyyy-MM');
			const purchaseCount = cohorts[key] || 0;

			results.push({
				[key]: purchaseCount,
			});
		});

		return results;
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
		startDate?: string,
		endDate?
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

async getAverageLtv(
	userId: number,
	daysGone: number = 0,
	startDate?: string, // Формат YYYY-MM-DD
	endDate?: string    // Формат YYYY-MM-DD
): Promise<{ [key: string]: number }[]> {
	// 1. Валидация дат
	this.validateDate(startDate, endDate, daysGone);

	// 2. Создание фильтра дат
	const dateFilter = await this.createDateFilter(daysGone, startDate, endDate);

	// 3. Получение ID клиентов, связанных с пользователем
	const clientIds = await this.getAllClientIds(userId);

	if (clientIds.length === 0) {
	return []; // Если нет клиентов, возвращаем пустой массив
}

// 4. Получение даты первой покупки (с учётом фильтра дат)
const firstPurchase = await this.prisma.purchase.findFirst({
	where: {
		clientId: {
			in: clientIds,
		},
		...dateFilter,
	},
	orderBy: {
		createdAt: 'asc',
	},
	select: {
		createdAt: true,
	},
});

if (!firstPurchase) {
	return []; // Если нет покупок, возвращаем пустой массив
}

// 5. Определение начальной и конечной дат
const parsedStartDate = startDate
	? this.parseDate(startDate)
	: new Date(
		firstPurchase.createdAt.getFullYear(),
		firstPurchase.createdAt.getMonth(),
		1,
	);

const parsedEndDate = endDate
	? this.parseDate(endDate)
	: new Date(); // Текущая дата

// 6. Создание массива периодов (месяцев)
const periods: { start: Date; end: Date; daysInMonth: number }[] = [];
let currentStart = new Date(
	parsedStartDate.getFullYear(),
	parsedStartDate.getMonth(),
	1,
);

while (currentStart <= parsedEndDate) {
	const periodStart = new Date(
		currentStart.getFullYear(),
		currentStart.getMonth(),
		1,
	);
	const periodEnd = addMonths(periodStart, 1);

	const daysInMonth = differenceInCalendarDays(periodEnd, periodStart);

	periods.push({
		start: periodStart,
		end: periodEnd,
		daysInMonth,
	});

	// Переход к следующему месяцу
	currentStart = addMonths(currentStart, 1);
}

// 7. Получение всех покупок за указанный период
const purchases = await this.prisma.purchase.findMany({
	where: {
		clientId: {
			in: clientIds,
		},
		createdAt: {
			gte: parsedStartDate,
			lt: parsedEndDate,
		},
		amount: {
			gt: 0,
		},
	},
	select: {
		clientId: true,
		amount: true,
		createdAt: true,
	},
});

// 8. Группировка покупок по месяцам и клиентам
const monthClientAmountMap: Map<string, Map<number, number>> = new Map();

purchases.forEach((purchase) => {
	const month = format(purchase.createdAt, 'yyyy-MM');

	if (!monthClientAmountMap.has(month)) {
		monthClientAmountMap.set(month, new Map());
	}

	const clientSumMap = monthClientAmountMap.get(month)!;
	clientSumMap.set(
		purchase.clientId,
		(clientSumMap.get(purchase.clientId) || 0) + purchase.amount,
	);
});

// 9. Формирование результатов
const results: { [key: string]: number }[] = [];

periods.forEach((period) => {
	const key = format(period.start, 'yyyy-MM');
	const clientSumMap = monthClientAmountMap.get(key) || new Map();

	// Общий LTV за месяц для всех клиентов
	let totalLtv = 0;
	clientSumMap.forEach((amount) => {
		totalLtv += amount;
	});

	// Количество клиентов, совершивших покупки в этом месяце
	const numberOfClients = clientSumMap.size;

	// Рассчитываем средний LTV на клиента
	const averageLtvPerClient =
		numberOfClients > 0 ? totalLtv / numberOfClients : 0;

	// Делим на количество дней в месяце
	const daysInMonth = period.daysInMonth;
	const averageLtvPerClientPerDay =
		daysInMonth > 0 ? averageLtvPerClient / daysInMonth : 0;

	results.push({
		[key]: parseFloat(averageLtvPerClientPerDay.toFixed(2)),
	});
});

return results;
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
