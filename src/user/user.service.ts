import { Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'argon2';
import { PrismaService } from '../prisma.service';
import { CreateUserDTO, UpdateUserDTO } from '../dto/user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserById(id: number) {
    console.log('Полученный id:', id);
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  getUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
      },
    });
  }

  getUserByIdWithClients(id: number) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        clients: true,
      },
    });
  }

  async createUser(dto: CreateUserDTO) {
    return this.prisma.$transaction(async () => {
      const user = await this.prisma.user.create({
        data: {
          username: dto.username,
          name: dto.name !== '' ? dto.name : '',
          passwordHash: await hash(dto.password),
          tarrifId: dto.tarrifId || 1,
          email: dto.email,
        },
      });

      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: user.email === 'kasterinvladimir@gmail.com' ? 3 : 1,
        },
      });
      return user;
    });
  }

  updateUser(id: number, dto: UpdateUserDTO) {
    const data: Partial<UpdateUserDTO> = {};
    if (dto.email) data.email = dto.email;
    if (dto.name) data.name = dto.name;
    if (dto.username) data.username = dto.name;

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  deleteUser(id: number) {
    return this.prisma.user.delete({
      where: {
        id,
      },
    });
  }

  getAllUsers() {
    return this.prisma.user.findMany();
  }

  getUserProfileById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        name: true,
        email: true,
        username: true,
      },
    });
  }
}
