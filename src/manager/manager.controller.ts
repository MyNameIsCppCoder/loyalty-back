import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { ManagerCreateDto, ManagerUpdateDTO } from '@/src/dto/manager.dto';
import { JwtAuth } from '@/src/guards/authGuar.jwt';
import { RolesGuard } from '@/src/guards/roles.guard';


@UseGuards(JwtAuth, RolesGuard)
@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Post('create/')
  async createManager(@Body() data: ManagerCreateDto, @Request() req: any){
    return await this.managerService.createManager(data, +req.user.userId);
  }

  @Get('show/')
  async showManager(@Request() req: any) {
    return this.managerService.getManagers(+req.user.userId);
  }

  @Delete(':id/')
  async deleteManager(@Param() managerId: string, @Request() req: any) {
    return await this.managerService.deleteManager(+managerId ,+req.user.userId);
  }

  @Put(':id/')
  async updateManager(@Param('id') managerId: string, @Request() req: any, @Body() data: ManagerUpdateDTO) {
    return await this.managerService.updateManager(+managerId, data, +req.user.userId);
  }


}
