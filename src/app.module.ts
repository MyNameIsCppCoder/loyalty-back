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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
