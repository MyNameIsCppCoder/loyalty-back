import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { RoleModule } from './role/role.module';
import { ClientModule } from './client/client.module';
import { PurchaseModule } from './purchase/purchase.module';
import { VisitModule } from './visit/visit.module';
import { ReportModule } from './report/report.module';
import { TarrifModule } from './tarrif/tarrif.module';
import { CashbackTransactionModule } from './cashback-transaction/cashback-transaction.module';
import { ManagerModule } from './manager/manager.module';
import { MailModule } from './mail/mail.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { BankModule } from './bank/bank.module';
import { LoggingModule } from './logging/logging.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    RoleModule,
    ClientModule,
    PurchaseModule,
    VisitModule,
    ReportModule,
    TarrifModule,
    CashbackTransactionModule,
    ManagerModule,
    MailModule,
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
    }),
    BankModule,
    LoggingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
