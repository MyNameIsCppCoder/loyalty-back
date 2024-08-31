import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RoleCreateDTO } from '../dto/role.dto';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllRole() {
    return this.prisma.role.findMany();
  }

  async findIdRoleByUserId(userId: number) {
    const role = await this.prisma.userRole.findFirst({
      where: {
        userId,
      },
    });
    return role ? role.roleId : null;
  }

  async createRole(dto: RoleCreateDTO) {
    return this.prisma.role.create({
      data: {
        ...dto,
      },
    });
  }

  async addRoleToUser(userId: number, roleId: number) {
    return this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  async updateRoleToUser(userId: number, newRoleId: number) {
    const oldRoleId = await this.findIdRoleByUserId(userId);
    if (oldRoleId) {
      await this.deleteRoleToUser(userId);
      return this.addRoleToUser(userId, newRoleId);
    }
    return this.addRoleToUser(userId, newRoleId);
  }

  async deleteRoleToUser(userId: number) {
    const roleId = await this.findIdRoleByUserId(userId);
    if (!roleId) throw new Error('User has no role to delete');
    return this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
  }
  async deleteRole(roleId: number) {
    return this.prisma.role.delete({
      where: {
        id: roleId,
      },
    });
  }
}
