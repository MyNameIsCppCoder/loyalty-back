import { Module } from '@nestjs/common';
import { CashbackTransactionService } from './cashback-transaction.service';
import { CashbackTransactionController } from './cashback-transaction.controller';
import { PrismaService } from '../prisma.service';
import { LoggingService } from '../logging/logging.service';

@Module({
  controllers: [CashbackTransactionController],
  providers: [CashbackTransactionService, PrismaService, LoggingService],
})
export class CashbackTransactionModule {}
