import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [RoleController],
  providers: [RoleService, PrismaService],
  imports: [],
})
export class RoleModule {}
