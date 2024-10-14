import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuth } from '../guards/authGuar.jwt';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorators';

@UseGuards(JwtAuth, RolesGuard)
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('mean-check/')
  @Roles('admin', 'user')
  async getMeanCheck(
    @Req() req: any,
    @Query('days') daysGone?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.reportService.getAverageOrderValueByAllClient(
      req.user.userId,
      +daysGone,
      startDate,
      endDate,
    );
  }

  @Get('mean-check/:id/')
  @Roles('admin', 'user')
  async getMeanCheckByClient(
    @Req() req: any,
    @Param('id', ParseIntPipe) clientId: number,
    @Query('days') daysGone?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.reportService.getAverageOrderValueByClient(
      req.user.userId,
      clientId,
      +daysGone,
      startDate,
      endDate,
    );
  }

  @Get('active/')
  @Roles('admin', 'user')
  async getActiveClients(
    @Req() req: any,
    @Query('days') daysGone?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.getActiveClientByMentionedDay(
      req.user.userId,
      +daysGone,
      startDate,
      endDate,
    );
  }

  @Get('cohort')
  @Roles('admin', 'user')
  async getCohort(
    @Req() req: any,
    @Query('days') daysGone?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.getCohortAnalysis(
      req.user.userId,
      +daysGone,
      startDate,
      endDate,
    );
  }

  @Get('repeat')
  @Roles('admin', 'user')
  async getRepeatRate(
    @Req() req: any,
    @Query('days') daysGone: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.getRepeatPurchaseRate(
      req.user.userId,
      +daysGone,
      startDate,
      endDate,
    );
  }

  @Get('churn')
  @Roles('admin', 'user')
  async getChurnRate(
    @Req() req: any,
    @Query('days') daysGone?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.getChurnRate(
      req.user.userId,
      +daysGone,
      startDate,
      endDate,
    );
  }

  @Get('ltv')
  @Roles('admin', 'user')
  async getCustomersLifeValue(
    @Req() req: any,
    @Query('days') daysGone?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.getCustomerLifetimeValue(
      req.user.userId,
      +daysGone,
      startDate,
      endDate,
    );
  }

  @Get('average-ltv')
  @Roles('admin', 'user')
  async getMeanLtv(
    @Req() req: any,
    @Query('days') daysGone?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.getAverageLtv(
      +req.user.userId,
      +daysGone,
      startDate,
      endDate,
    );
  }

  @Get('activity-days')
  @Roles('admin', 'user')
  async getCustomersActivityDays(
    @Req() req: any,
    @Query('days') daysGone?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.getCustomerActivityDays(
      req.user.userId,
      +daysGone,
      startDate,
      endDate,
    );
  }

  @Get('purchase-frequency')
  @Roles('admin', 'user')
  async getPurchaseFrequency(
    @Req() req: any,
    @Query('days') daysGone: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.getAveragePurchaseFrequency(
      req.user.userId,
      +daysGone,
      startDate,
      endDate,
    );
  }

  @Get('main-metrics')
  @Roles('admin', 'user')
  async getAllMetcrics(
    @Req() req: any,
    @Query('days') daysGone: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.reportService.calculateClientMetrics(
      req.user.userId,
      +daysGone,
      startDate,
      endDate,
    );
  }
}
