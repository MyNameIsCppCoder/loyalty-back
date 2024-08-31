import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ClientCreateDTO, ClientUpdateDTO } from '../dto/client.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllClients() {
    return this.prisma.client.findMany({
      include: {
        purchase: true,
        visits: true,
        cashBackTransaction: true,
      },
    });
  }

  async findByEmail(userId: number, email: string) {
    const result = await this.prisma.client.findFirst({
      where: {
        userClient: {
          some: {
            userId,
          },
        },
        email: email,
      },
    });
    console.log('Result from findByEmail:', result);
    return result;
  }

  async findByPhone(userId: number, phone: string) {
    const result = await this.prisma.client.findFirst({
      where: {
        userClient: {
          some: {
            userId,
          },
        },
        phone: phone,
      },
    });
    console.log('Result from findByPhone:', result);
    return result;
  }

  async findByPhoneOrEmail(userId: number, email?: string, phone?: string) {
    console.log(`${phone} and ${email} was recived`);
    console.log(`${typeof phone} and ${typeof email} was recived`);
    if (phone) {
      console.log('phone search was started');
      return await this.findByPhone(userId, phone);
    } else if (email) {
      console.log('mail search was started');
      return await this.findByEmail(userId, email);
    } else {
      throw new BadRequestException(
        'At least one of phone or email must be provided',
      );
    }
  }

  async getClientById(id: number) {
    return this.prisma.client.findUnique({
      where: { id },
    });
  }

  async addClientToUser(clientId: number, userId: number) {
    return this.prisma.userClient.create({
      data: {
        clientId: clientId,
        userId: userId,
      },
    });
  }

  async createClient(dto: ClientCreateDTO, userId: number) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) throw new NotFoundException('User not found');
    return this.prisma.$transaction(async (prisma) => {
      const client = await prisma.client.create({
        data: { ...dto },
      });
      await prisma.userClient.create({
        data: {
          clientId: client.id,
          userId: userId,
        },
      });
      return client;
    });
  }

  async deleteClient(clientId: number, userId: number) {
    const existingClient = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { userClient: true },
    });
    if (
      !existingClient ||
      !existingClient.userClient.some((uc) => uc.userId === userId)
    ) {
      return new NotFoundException("User wasn't find");
    }
    return this.prisma.client.delete({
      where: {
        id: clientId,
      },
    });
  }

  async updateClient(dto: ClientUpdateDTO, clientId: number) {
    try {
      const existingClient = await this.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!existingClient) {
        throw new NotFoundException(`Client with ID ${clientId}
          does not exist!`);
      }
      return await this.prisma.client.update({
        where: { id: clientId },
        data: { ...dto },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A client with this email already exists',
          );
        }
      }
      throw new InternalServerErrorException('Failed to update client');
    }
  }

  async getClientsByUserId(userId: number) {
    return this.prisma.client.findMany({
      where: {
        userClient: {
          some: {
            userId,
          },
        },
      },
    });
  }
}
