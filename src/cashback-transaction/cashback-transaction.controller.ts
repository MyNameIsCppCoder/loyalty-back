import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CashbackTransactionService } from './cashback-transaction.service';
import { JwtAuth } from '../guards/authGuar.jwt';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorators';

@UseGuards(JwtAuth, RolesGuard)
@Controller('transaction')
export class CashbackTransactionController {
  constructor(
    private readonly cashbackTransactionService: CashbackTransactionService,
  ) {}

  @Get('bill')
  @Roles('admin', 'manager', 'user')
  async payBonus(
    @Query('id', ParseIntPipe) clientId: number,
    @Query('amount', ParseIntPipe) amount: number,
    @Req() req: any,
  ) {
    return await this.cashbackTransactionService.payByBonus(clientId, amount, +req.user.userId);
  }
}
