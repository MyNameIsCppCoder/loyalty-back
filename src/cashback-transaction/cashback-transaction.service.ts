import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CashbackTransactionService {
  constructor(private readonly prisma: PrismaService) {}

  validateTransaction(amount: number, balance: number) {
    return amount < balance ? true : false;
  }

  async payByBonus(clientId: number, amount: number) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { cashBackTransaction: true, cashbackPercentage: true },
    });

    if (client && client.cashBackTransaction) {
      const totalCashback = client.cashBackTransaction.reduce(
        (acc, entity) => acc + entity.amount * client.cashbackPercentage,
        0,
      );
      if (this.validateTransaction(amount, totalCashback))
        return this.prisma.cashBackTransaction.create({
          data: { amount: -amount, clientId },
        });
    }
    throw new BadRequestException('Not enought bonus');
  }
}
