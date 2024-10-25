import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ClientCreateDTO, ClientUpdateDTO } from '../dto/client.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class ClientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggingService: LoggingService,
  ) {}

  private async getOwnerUserId(userId: number) {
    const manager = await this.prisma.manager.findMany({
      where: { userCreatedId: userId },
      select: {
        userCreatedId: true,
      },
    });

    if (manager) {
      return manager[0].userCreatedId;
    }

    // Else, userId is a regular user's id
    return userId;
  }

  async getAllClients() {
    // Логируем получение всех клиентов
    // Здесь может быть лог уровня "debug" или "info"
    try {
      const clients = await this.prisma.client.findMany({
        include: {
          purchase: true,
          visits: true,
          cashBackTransaction: true,
        },
      });
      return clients;
    } catch (error) {
      // Логируем ошибку
      console.error('Ошибка при получении всех клиентов:', error);
      throw new InternalServerErrorException('Failed to get all clients');
    }
  }

  async findByEmail(userId: number, email: string) {
    try {
      const client = await this.prisma.client.findFirst({
        where: {
          userClient: {
            some: {
              userId,
            },
          },
          email,
        },
      });
      if (!client) return null;

      const totalCashback = await this.prisma.cashBackTransaction.aggregate({
        where: {
          clientId: client.id,
        },
        _sum: {
          amount: true,
        },
      });

      return { ...client, totalCashback: totalCashback._sum.amount || 0 };
    } catch (error) {
      console.error('Ошибка при поиске клиента по email:', error);
      throw new InternalServerErrorException('Failed to find client by email');
    }
  }

  async findByPhone(userId: number, phone: string) {
    try {
      const client = await this.prisma.client.findFirst({
        where: {
          userClient: {
            some: {
              userId,
            },
          },
          phone: phone,
        },
      });

      if (!client) return null;

      const totalCashback = await this.prisma.cashBackTransaction.aggregate({
        where: {
          clientId: client.id, // Используем id найденного клиента
        },
        _sum: {
          amount: true,
        },
      });

      return {
        ...client,
        totalCashback: totalCashback._sum.amount || 0,
      };
    } catch (error) {
      console.error('Ошибка при поиске клиента по телефону:', error);
      throw new InternalServerErrorException('Failed to find client by phone');
    }
  }

  async findByPhoneOrEmail(userId: number, email?: string, phone?: string) {
    if (phone) {
      return await this.findByPhone(userId, phone);
    } else if (email) {
      return await this.findByEmail(userId, email);
    } else {
      throw new BadRequestException(
        'Необходимо указать хотя бы email или телефон',
      );
    }
  }

  async getClientById(id: number) {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id },
        include: { cashBackTransaction: true },
      });
      if (!client) {
        throw new NotFoundException(`Клиент с ID ${id} не найден`);
      }
      return client;
    } catch (error) {
      console.error('Ошибка при получении клиента по ID:', error);
      throw new InternalServerErrorException('Failed to get client by ID');
    }
  }

  async addClientToUser(clientId: number, userId: number) {
    try {
      const result = await this.prisma.userClient.create({
        data: {
          clientId: clientId,
          userId: userId,
        },
      });

      // Логируем добавление клиента к пользователю
      await this.loggingService.logAction(
        userId,
        'ADD_CLIENT_TO_USER',
        'Client',
        clientId,
      );

      return result;
    } catch (error) {
      console.error('Ошибка при добавлении клиента к пользователю:', error);
      throw new InternalServerErrorException('Failed to add client to user');
    }
  }

  async createClient(dto: ClientCreateDTO, userId: number) {
    const ownerUserId = await this.getOwnerUserId(userId);

    // Получаем владельца и его тариф
    const ownerUser = await this.prisma.user.findUnique({
      where: { id: ownerUserId },
      include: {
        tarrif: true,
      },
    });

    if (!ownerUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Получаем максимальное количество клиентов из тарифа
    const maxClients = ownerUser.tarrif?.maxClient;

    if (maxClients === undefined || maxClients === null) {
      throw new InternalServerErrorException(
        'Информация о тарифе пользователя отсутствует',
      );
    }

    // Считаем текущее количество клиентов, связанных с владельцем
    const currentClientCount = await this.prisma.userClient.count({
      where: {
        userId: ownerUserId,
      },
    });

    // Проверяем, достигнут ли лимит
    if (currentClientCount >= maxClients) {
      throw new ForbiddenException(
        'Вы достигли максимального количества клиентов, разрешенного вашим тарифом.',
      );
    }

    // Создаем клиента и связываем его с владельцем
    try {
      const client = await this.prisma.$transaction(async (prisma) => {
        const client = await prisma.client.create({
          data: { ...dto },
        });

        await prisma.userClient.create({
          data: {
            clientId: client.id,
            userId: ownerUserId,
          },
        });

        return client;
      });

      // Логируем создание клиента
      await this.loggingService.logAction(
        ownerUserId,
        'CREATE',
        'Client',
        client.id,
      );

      return client;
    } catch (error) {
      console.error('Ошибка при создании клиента:', error);
      throw new InternalServerErrorException('Failed to create client');
    }
  }

  async deleteClient(clientId: number, userId: number) {
    try {
      const existingClient = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: { userClient: true },
      });
      if (
        !existingClient ||
        !existingClient.userClient.some((uc) => uc.userId === userId)
      ) {
        throw new NotFoundException('Клиент не найден или недоступен');
      }

      const deletedClient = await this.prisma.client.delete({
        where: {
          id: clientId,
        },
      });

      // Логируем удаление клиента
      await this.loggingService.logAction(userId, 'DELETE', 'Client', clientId);

      return deletedClient;
    } catch (error) {
      console.error('Ошибка при удалении клиента:', error);
      throw new InternalServerErrorException('Failed to delete client');
    }
  }

  async updateClient(dto: ClientUpdateDTO, clientId: number, userId: number) {
    try {
      const existingClient = await this.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!existingClient) {
        throw new NotFoundException(`Клиент с ID ${clientId} не существует`);
      }

      const updatedClient = await this.prisma.client.update({
        where: { id: clientId },
        data: { ...dto },
      });

      // Логируем обновление клиента
      await this.loggingService.logAction(userId, 'UPDATE', 'Client', clientId);

      return updatedClient;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Клиент с таким email уже существует');
        }
      }
      console.error('Ошибка при обновлении клиента:', error);
      throw new InternalServerErrorException('Failed to update client');
    }
  }

  async getClientsByUserId(userId: number) {
    const ownerUserId = await this.getOwnerUserId(userId);

    try {
      // Получаем клиентов, связанных с владельцем
      const clients = await this.prisma.client.findMany({
        where: {
          userClient: {
            some: {
              userId: ownerUserId,
            },
          },
        },
        include: {
          visits: true,
        },
      });

      if (clients.length === 0) return null;

      const allClientsWithCashBack = await Promise.all(
        clients.map(async (client) => {
          const totalCashback = await this.prisma.cashBackTransaction.aggregate(
            {
              where: {
                clientId: client.id,
              },
              _sum: {
                amount: true,
              },
            },
          );
          return { ...client, totalCashback: totalCashback._sum.amount || 0 };
        }),
      );

      return allClientsWithCashBack;
    } catch (error) {
      console.error('Ошибка при получении клиентов по userId:', error);
      throw new InternalServerErrorException('Failed to get clients by userId');
    }
  }
}
