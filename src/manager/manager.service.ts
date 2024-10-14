import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/src/prisma.service';
import { hash } from 'argon2';
import { ManagerCreateDto, ManagerUpdateDTO } from '@/src/dto/manager.dto';

@Injectable()
export class ManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async createManager(data: ManagerCreateDto, userId: number) {
    const creatingUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        tarrif: true,
      },
    });
    if (!creatingUser) throw new NotFoundException('user not exists');
    const hashedPassword = await hash(data.password);
    return this.prisma.$transaction(async () => {
      const newUser = await this.prisma.user.create({
        data: {
          username: data.username,
          passwordHash: hashedPassword,
          tarrif: { connect: { id: creatingUser.tarrif.id } },
          email: data.email,
          phone: data.phone ?? '',
        },
      });
      const newRole = await this.prisma.userRole.create({
        data: {
          userId: newUser.id,
          roleId: 2,
        },
      });

      const manager = await this.prisma.manager.create({
        data: {
          username: newUser.username,
          userCreated: {connect: { id: creatingUser.id } },
          userManager: {
            connect: { id: newUser.id },
          },
        },
      });
      console.log(newUser, manager)
      return {
        newUser, manager
      };
    });
  }

  async getManagers(userId: number) {
    const createdUser = await this.prisma.user.findUnique({
      where: {id: userId},
    })
    if (!createdUser) throw new NotFoundException('user not exists');
    const managers = await this.prisma.manager.findMany({
      where: {
        userCreatedId: createdUser.id
      }
    })
    const managerIds = managers.map(manager => manager.userManagerId)
    const userManagersEntity = []
    for (let k = 0; k < managerIds.length; k++) {
      console.log(managerIds[k])
      userManagersEntity.push(await this.prisma.user.findUnique({where: {id: managerIds[k]}}))
    }
    console.log(userManagersEntity)
    const userManagers = []
    for (let k = 0; k < managerIds.length - 1; k++) {
      userManagers.push({ ...managers, ...userManagersEntity })
    }
    return userManagers;
  }

  async deleteManager(managerId: number, userId: number) {
    const manager = await this.prisma.manager.findFirst({
      where: {
        id: managerId,
        userCreatedId: userId,
      },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found or does not belong to the user');
    }

    return this.prisma.manager.delete({
      where: { id: manager.id },
    });
  }

  async updateManager(managerId: number, data: ManagerUpdateDTO, userId: number) {
    const manager = await this.prisma.manager.findUnique({
      where: {
        id: managerId,
        userCreatedId: userId,
      },
      include: {
        userManager: true,
        userCreated: true,
      },
    });
    if (!manager) {
      throw new NotFoundException('Manager not found or does not belong to the user');
    }
    const managerUser = await this.prisma.user.findUnique(
      {
        where: { id: manager.userManagerId }
      });
    return this.prisma.user.update({
      where: {id: managerUser.id},
      data: { ...data },
    })
  }

  }
