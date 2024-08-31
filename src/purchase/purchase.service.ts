import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PurchaseService {
  constructor(private readonly prisma: PrismaService) {}

  calculateCashBack(amount: number, percent: number) {
    return (amount * (percent || 0)) / 100;
  }

  isClientExists(client: any) {
    if (!client) throw new NotFoundException('client not found');
  }

  async getAllPurchase() {
    return this.prisma.visit.findMany();
  }
  async createPurchase(
    clientId: number,
    userId: number,
    purchaseAmount: number,
  ) {
    return this.prisma.$transaction(async () => {
      const visit = await this.prisma.visit.create({ data: { clientId } });
      const purchase = await this.prisma.purchase.create({
        data: {
          userId: userId,
          clientId: clientId,
          amount: purchaseAmount,
          visitId: visit.id,
        },
        include: {
          visit: true,
        },
      });

      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        select: { cashbackPercentage: true },
      });
      this.isClientExists(client);
      const cashbackAmount = this.calculateCashBack(
        purchaseAmount,
        client.cashbackPercentage,
      );

      await this.prisma.cashBackTransaction.create({
        data: {
          client: {
            connect: { id: clientId },
          },
          amount: cashbackAmount,
        },
      });
      return purchase;
    });
  }

  async getPurchaseByUserId(userId: number) {
    return this.prisma.purchase.findMany({
      where: {
        userId,
      },
    });
  }

  async deletePurchaseById(id: number) {
    return this.prisma.$transaction(async () => {
      const purchase = await this.prisma.purchase.delete({
        where: { id: id },
        select: { userId: true, amount: true },
      });
      const client = await this.prisma.client.findFirst({
        where: {
          purchase: {
            some: {
              id: id,
            },
          },
        },
      });
      this.isClientExists(client);
      const cashbackAmount = this.calculateCashBack(
        purchase.amount,
        client.cashbackPercentage,
      );

      await this.prisma.cashBackTransaction.create({
        data: {
          client: {
            connect: { id: client.id },
          },
          amount: -cashbackAmount,
        },
      });
      return purchase;
    });
  }

  async cancelPurchaseById(purchaseId: number) {
    return this.prisma.$transaction(async () => {
      const purchase = await this.prisma.purchase.delete({
        where: { id: purchaseId },
        select: { userId: true, amount: true },
      });
      const client = await this.prisma.client.findFirst({
        where: {
          purchase: {
            some: {
              id: purchaseId,
            },
          },
        },
      });
      this.isClientExists(client);
      const cashbackAmount = this.calculateCashBack(
        purchase.amount,
        client.cashbackPercentage,
      );

      await this.prisma.cashBackTransaction.create({
        data: {
          client: {
            connect: { id: client.id },
          },
          amount: -cashbackAmount,
        },
      });
      return purchase;
    });
  }
}
