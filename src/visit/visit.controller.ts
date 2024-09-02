import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VisitService } from './visit.service';
import { JwtAuth } from '../guards/authGuar.jwt';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorators';

@UseGuards(JwtAuth, RolesGuard)
@Controller('visit')
export class VisitController {
  constructor(private readonly visitService: VisitService) {}

  @Get()
  @Roles('admin')
  async getAllUser() {
    return await this.visitService.getAllVisits();
  }

  @Get('current/:id/')
  @Roles('admin', 'user', 'manager')
  async getAllVisitsByClientId(
    @Param('id', ParseIntPipe) clientId: number,
    @Req() req: any,
  ) {
    return await this.visitService.getAllVisitsByClientId(
      clientId,
      req.user.userId,
    );
  }

  @Get('user/:id')
  @Roles('admin', 'user', 'manager')
  async getAllClientsVisitByUserId(@Req() req: any) {
    return await this.visitService.getAllVisitsByUserId(req.user.userId);
  }
}
