import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class VisitService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllVisits() {
    return this.prisma.visit.findMany();
  }

  async getAllVisitsByClientId(clientId: number, userId: number) {
    return this.prisma.visit.findMany({
      where: {
        clientId,
        client: {
          userClient: {
            some: { userId },
          },
        },
      },
    });
  }

  async getAllVisitsByUserId(userId: number) {
    return this.prisma.visit.findMany({
      where: {
        client: {
          userClient: { some: { userId } },
        },
      },
    });
  }
}
