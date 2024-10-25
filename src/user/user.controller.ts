import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDTO, UpdateUserDTO } from '../dto/user.dto';
import { JwtAuth } from 'src/guards/authGuar.jwt';
import { Roles } from 'src/decorators/roles.decorators';
import { RolesGuard } from 'src/guards/roles.guard';

@Controller('users/')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register/')
  async registereUser(@Body() dto: CreateUserDTO) {
    const { other, email } = {
      other: dto,
      email: dto.email,
    };
    if (!this.userService.getUserByEmail(email)) {
      return new BadRequestException('User alredy exists');
    }

    return await this.userService.createUser(dto);
  }

  @Get('all')
  @UseGuards(JwtAuth, RolesGuard)
  @Roles('admin')
  async getAllUsers() {
    return await this.userService.getAllUsers();
  }

  @UseGuards(JwtAuth, RolesGuard)
  @Get(':id(\\d+)')
  async getUserById(@Param('id') id: string) {
    return await this.userService.getUserById(+id);
  }

  @UseGuards(JwtAuth, RolesGuard)
  @Put(':id/')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDTO,
    @Req() req: any,
  ) {
    if (+req.user.userId === +id) {
      return await this.userService.updateUser(+id, dto);
    }
    return new ForbiddenException('U TRYNA UPDATE SOMEONE ELSE');
  }

  @UseGuards(JwtAuth, RolesGuard)
  @Roles('admin')
  @Delete(':id/')
  async deleteUser(@Param('id') id: string) {
    return await this.userService.deleteUser(+id);
  }

  @UseGuards(JwtAuth, RolesGuard)
  @Roles('admin', 'manager', 'user')
  @Get('find/')
  async getUser(@Req() req: any) {
    console.log('user id is: ', req.user.userId);
    return await this.userService.getUserById(+req.user.userId);
  }

  @UseGuards(JwtAuth, RolesGuard)
  @Roles('admin', 'manager', 'user')
  @Get('profile')
  async getProfile(@Req() req: any) {
    return await this.userService.getUserProfileById(+req.user.userId);
  }
}
