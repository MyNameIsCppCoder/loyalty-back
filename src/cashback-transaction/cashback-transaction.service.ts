import { BadRequestException, Injectable, LoggerService } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class CashbackTransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggingService: LoggingService,
  ) {}

  validateTransaction(amount: number, balance: number) {
    return amount < balance ? true : false;
  }

  async payByBonus(clientId: number, amount: number, userId: number) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { cashBackTransaction: true, cashbackPercentage: true },
    });

    if (client && client.cashBackTransaction) {
      const totalCashback = client.cashBackTransaction.reduce(
        (acc, entity) => acc + entity.amount * client.cashbackPercentage,
        0,
      );
      if (this.validateTransaction(amount, totalCashback)) {
        const cashback = await this.prisma.cashBackTransaction.create({
          data: { amount: -amount, clientId },
        });
        this.loggingService.logAction(userId, 'MINUS', 'CASHBACK', cashback.id);
        return cashback;
      }
      throw new BadRequestException('Not enought bonus');
    }
  }
}
