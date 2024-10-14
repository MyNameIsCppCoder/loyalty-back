import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDTO } from 'src/dto/user.dto';
import { Request, Response } from 'express';
import { JwtAuth } from '../guards/authGuar.jwt';
import { tr } from '@faker-js/faker';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() dto: LoginUserDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
      const { email, password } = dto;
      const accessToken = await this.authService.login(email, password, res);
      return { accessToken };
  }

  @Get('cookie')
  async cookies(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    res.cookie('refreshToken', '123213121', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // Только для разработки по HTTP
      maxAge: 1000 * 60 * 60 * 24 * 15, // 15 дней
    });
    return {
      cookies: req.cookies,
    };
  }

  @Post('update-token')
  async updateToken(@Res({ passthrough: true }) res: any, @Req() req: any) {
    return this.authService.updateRefreshToken(res, req);
  }

  @Get('logout')
  @UseGuards(JwtAuth)
  async logout(@Res() res: any) {
    return this.authService.deleteTokenFromCookie(res);
  }

  @Get('check-token')
  @UseGuards(JwtAuth)
  async checkToken() {
    return { message: 'token is valid' };
  }
}
