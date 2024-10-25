import {
  Body,
  Controller,
  Get,
  Request,
  UseGuards,
  Post,
  Param,
  Delete,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { JwtAuth } from '../guards/authGuar.jwt';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { ClientCreateDTO, ClientUpdateDTO } from '../dto/client.dto';

@Controller('clients')
@UseGuards(JwtAuth, RolesGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Roles('admin')
  @Get('all-users')
  async getAllClient() {
    return await this.clientService.getAllClients();
  }

  @Post('create')
  @Roles('admin', 'user', 'manager')
  async createClient(@Body() dto: ClientCreateDTO, @Request() req: any) {
    return await this.clientService.createClient(dto, +req.user.userId);
  }

  @Get('id/:id/')
  @Roles('admin', 'user', 'manager')
  async getUserById(@Param('id') clientId: string) {
    return await this.clientService.getClientById(+clientId);
  }

  @Roles('admin', 'user', 'manager')
  @Get('current/')
  async getUserByPhoneOrEmail(
    @Request() req: any,
    @Query('email') email?: string,
    @Query('phone') phone?: string,
  ) {
    return await this.clientService.findByPhoneOrEmail(
      req.user.userId,
      email,
      phone,
    );
  }

  @Delete(':id/')
  @Roles('admin', 'user', 'manager')
  async deleteClient(@Param('id') clientId: string, @Request() req: any) {
    return await this.clientService.deleteClient(+clientId, req.user.userId);
  }

  @Roles('admin', 'user', 'manager')
  @Put(':id/')
  async updateClientInfo(
    @Body() dto: ClientUpdateDTO,
    @Param('id') clientId: string,
    @Req() req: any,
  ) {
    return await this.clientService.updateClient(
      dto,
      +clientId,
      +req.user.userId,
    );
  }

  @Get('show/')
  @Roles('admin', 'user', 'manager')
  async showAllClients(@Request() req: any) {
    return await this.clientService.getClientsByUserId(req.user.userId);
  }
}
