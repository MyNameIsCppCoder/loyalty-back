import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'src/prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { MailService } from '../mail/mail.service';
import { LoggingService } from '../logging/logging.service';

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [
    UserService,
    PrismaService,
    JwtStrategy,
    MailService,
    LoggingService,
  ],
  exports: [UserService],
})
export class UserModule {}
