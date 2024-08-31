import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { JwtAuth } from '../guards/authGuar.jwt';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorators';

@Controller('purchase')
@UseGuards(JwtAuth, RolesGuard)
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Get()
  @Roles('admin')
  async getAllPurchase() {
    return await this.purchaseService.getAllPurchase();
  }

  @Post('create/:id/')
  @Roles('admin', 'user', 'manager')
  async createPurchase(
    @Req() req: any,
    @Query('amount', ParseIntPipe) purchaseAmount: number,
    @Param('id', ParseIntPipe) clientId: number,
  ) {
    return await this.purchaseService.createPurchase(
      clientId,
      req.user.userId,
      purchaseAmount,
    );
  }

  @Get('all')
  @Roles('admin', 'user', 'manager')
  async getAllPurchaseByUserId(@Req() req: any) {
    return await this.purchaseService.getPurchaseByUserId(req.user.userId);
  }

  @Get('cancel/:id/')
  @Roles('admin', 'user', 'manager')
  async cancelClientPurchase(@Param('id', ParseIntPipe) purchaseId: number) {
    return await this.purchaseService.cancelPurchaseById(purchaseId);
  }

  @Delete(':id/')
  @Roles('admin')
  async deletePurchaseAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseService.deletePurchaseById(id);
  }
}
