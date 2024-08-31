import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDTO } from 'src/dto/user.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: AuthService,
  ) {}
  @Post('login')
  async login(@Body() dto: LoginUserDTO, @Res() res: Response) {
    const { email, password } = dto;

    const user = await this.userService.login(email, password, res);
    if (!user) {
      return res.status(400).json(new BadRequestException('User not found'));
    }

    const accessToken = await this.authService.login(email, password, res);
    return res.json({ accessToken });
  }

  /* @Get('logout')
  @UseGuards() */
}
