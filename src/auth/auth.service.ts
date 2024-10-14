import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { Request, Response } from 'express';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async verifyAuthToken(token: string) {
    return this.jwt.verify(token);
  }

  async findUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          select: { role: true },
        },
      },
    });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
      },
      include: {
        roles: {
          select: { role: true },
        },
      },
    });
  }

  async validateUser(user: any) {
    if (!user) {
      throw new UnauthorizedException('User was not found');
    }
  }

  async verifyPassword(hashedPassword: string, password: string) {
    try {
      return await verify(hashedPassword, password);
    } catch (error) {
      throw new UnauthorizedException('Password verification failed');
    }
  }

  getPayload(user: any) {
    return {
      username: user.username,
      roles: user.roles,
      sub: user.id,
    };
  }

  setRefreshTokenInCookie(token: string, res: Response) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 15, // 15 дней
    });
  }

  deleteTokenFromCookie(res: Response) {
    res.clearCookie('refreshToken');
  }

  addTokenAndReturnAccess(user: any) {
    const payload = this.getPayload(user);
    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwt.sign(payload, { expiresIn: '1d' });

    return { accessToken, refreshToken };
  }

  async updateRefreshToken(res: Response, req: Request) {
    const token = req.cookies['refreshToken'];

    if (!token) {
      throw new UnauthorizedException('Token not found'); // Если токена нет, выбрасываем исключение
    }

    try {
      const payload = this.jwt.verify(token);
      const user = await this.findUserById(+payload.sub);

      await this.validateUser(user);

      const newAccessToken = this.jwt.sign(this.getPayload(user), {
        expiresIn: '15m',
      });
      const newRefreshToken = this.jwt.sign(this.getPayload(user), {
        expiresIn: '15d',
      });

      this.setRefreshTokenInCookie(newRefreshToken, res); // Обновляем куку с новым рефреш токеном

      return { accessToken: newAccessToken }; // Возвращаем только accessToken
    } catch (error) {
      this.deleteTokenFromCookie(res);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async login(email: string, password: string, res: Response) {
    const user = await this.findUserByEmail(email);
    await this.validateUser(user);
    const isPasswordValid = await this.verifyPassword(
      user.passwordHash,
      password,
    );
    if (!isPasswordValid) {
      throw new NotFoundException('Incorrect password');
    }
    const { accessToken, refreshToken } = this.addTokenAndReturnAccess(user);
    this.setRefreshTokenInCookie(refreshToken, res); // Устанавливаем refresh токен в куку
    return accessToken; // Возвращаем только accessToken
  }
}
