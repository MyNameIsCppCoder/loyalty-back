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

@UseGuards(JwtAuth, RolesGuard)
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('mean-check/')
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

  @Get('activity-days')
  async getCustomersActivityDays(
    @Req() req: any,
    @Query('days') daysGone?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // TODO: check business-logic about what we extcract from DB
    return this.reportService.getCustomerActivityDays(
      req.user.userId,
      +daysGone,
      startDate,
      endDate,
    );
  }

  @Get('purchase-frequency')
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
