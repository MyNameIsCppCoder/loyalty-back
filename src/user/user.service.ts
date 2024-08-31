import { Injectable } from '@nestjs/common';
import { hash } from 'argon2';
import { PrismaService } from '../prisma.service';
import { CreateUserDTO, UpdateUserDTO } from '../dto/user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
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
    return this.prisma.user.create({
      data: {
        username: dto.username,
        name: dto.name !== '' ? dto.name : '',
        passwordHash: await hash(dto.password),
        tarrifId: dto.tarrifId || 1,
        email: dto.email,
      },
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
}
