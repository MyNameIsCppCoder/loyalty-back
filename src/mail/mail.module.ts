import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { PrismaService } from '../prisma.service';
import { LoggingService } from 'src/logging/logging.service';

@Module({
  controllers: [MailController],
  providers: [MailService, PrismaService, LoggingService],
  exports: [MailService],
})
export class MailModule {}
