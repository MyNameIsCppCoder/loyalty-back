import { Module } from '@nestjs/common';
import { CashbackTransactionService } from './cashback-transaction.service';
import { CashbackTransactionController } from './cashback-transaction.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CashbackTransactionController],
  providers: [CashbackTransactionService, PrismaService],
})
export class CashbackTransactionModule {}
