import { Module } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { ManagerController } from './manager.controller';
import { PrismaService } from '@/src/prisma.service';

@Module({
  controllers: [ManagerController],
  providers: [ManagerService, PrismaService],
})
export class ManagerModule {}
