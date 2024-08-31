import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { Response } from 'express';
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
    return await verify(hashedPassword, password);
  }

  async validatePassword(isValid: boolean) {
    if (!isValid) {
      throw new NotFoundException('Incorrect password');
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
      secure: true,
      sameSite: 'strict',
    });
  }

  async login(email: string, password: string, res: Response) {
    const user = await this.findUserByEmail(email);
    await this.validateUser(user);
    const isPasswordValid = await this.verifyPassword(
      user.passwordHash,
      password,
    );
    await this.validatePassword(isPasswordValid);
    const payload = this.getPayload(user);
    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwt.sign(payload, { expiresIn: '1d' });
    this.setRefreshTokenInCookie(refreshToken, res);
    return accessToken;
  }
}
