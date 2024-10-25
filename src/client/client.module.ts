import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { PrismaService } from '../prisma.service';
import { LoggingService } from '../logging/logging.service';

@Module({
  controllers: [ClientController],
  providers: [ClientService, PrismaService, LoggingService],
})
export class ClientModule {}
