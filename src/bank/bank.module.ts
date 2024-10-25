import { Module } from '@nestjs/common';
import { BankService } from './bank.service';
import { BankController } from './bank.controller';
import { PrismaService } from '../prisma.service';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggingService } from '../logging/logging.service';

@Module({
  controllers: [BankController],
  providers: [BankService, PrismaService, LoggingService],
  imports: [ScheduleModule.forRoot()],
})
export class BankModule {}
