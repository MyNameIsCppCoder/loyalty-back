import { Module } from '@nestjs/common';
import { TarrifService } from './tarrif.service';
import { TarrifController } from './tarrif.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TarrifController],
  providers: [TarrifService, PrismaService],
})
export class TarrifModule {}
