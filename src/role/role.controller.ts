import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorators';
import { RoleCreateDTO } from 'src/dto/role.dto';
import { JwtAuth } from 'src/guards/authGuar.jwt';
import { RolesGuard } from 'src/guards/roles.guard';
import { RoleService } from './role.service';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @UseGuards(JwtAuth, RolesGuard)
  @Roles('admin')
  @Get()
  async getAllRole() {
    return await this.roleService.getAllRole();
  }

  @UseGuards(JwtAuth, RolesGuard)
  @Roles('admin')
  @Post('create')
  async createRole(@Body() dto: RoleCreateDTO) {
    return await this.roleService.createRole(dto);
  }

  @UseGuards(JwtAuth)
  @Put(':id/')
  async addRoleToUser(@Req() req: any, @Param('id') roleId: string) {
    const id = +req.user.userId;
    return await this.roleService.addRoleToUser(id, +roleId);
  }

  @UseGuards(JwtAuth, RolesGuard)
  @Roles('admin')
  @Put('update/:id/')
  async updateRole(@Req() req: any, @Param('id') roleId: string) {
    const id = +req.user.userId;
    return await this.roleService.updateRoleToUser(id, +roleId);
  }

  @Delete(':id/')
  @UseGuards(JwtAuth, RolesGuard)
  @Roles('admin')
  async deleteRole(@Param('id', ParseIntPipe) roleId: number) {
    return await this.roleService.deleteRole(roleId);
  }
}
