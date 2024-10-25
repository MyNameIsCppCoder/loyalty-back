import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { BankService } from './bank.service';
import { JwtAuth } from '../guards/authGuar.jwt';
import { Cron } from '@nestjs/schedule';

@UseGuards(JwtAuth)
@Controller('bank')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Get('buy/start/:count')
  async getInfoStart(@Req() req: any, @Param('count') count: string) {
    return await this.bankService.getInfoStart(+req.user.userId, +count);
  }

  @Get('buy/business/:count')
  async getInfoBusiness(@Req() req: any, @Param('count') count: string) {
    return await this.bankService.getInfoBusiness(+req.user.userId, +count);
  }

  @Get('make-success/:id/:countMonth/:createdAt')
  async makeSuccess(
    @Param('id') id: string,
    @Req() req: any,
    @Param('countMonth') countMonth: string,
    @Param('createdAt') createdAt: string,
  ) {
    return await this.bankService.successPay(
      +id,
      +req.user.userId,
      +countMonth,
      createdAt,
    );
  }

  @Cron('0 0 * * *')
  async checkSubsribe() {
    return await this.bankService.removeSubscribe();
  }
}
