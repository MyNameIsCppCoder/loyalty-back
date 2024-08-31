import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from '../role/role.service';
import { PrismaService } from '../prisma.service';

describe('RoleService', () => {
  let service: RoleService;
  let prisma: PrismaService;

  // Инициализация RoleService и PrismaService перед каждым тестом
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleService, PrismaService],
    }).compile();

    service = module.get<RoleService>(RoleService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  // Проверка, что сервис был успешно создан
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllRole', () => {
    // Тестирование метода getAllRole, проверка, что он возвращает массив ролей
    it('should return an array of roles', async () => {
      const mockRoles = [
        { id: 1, roleName: 'admin', description: 'Admin role' },
      ];
      jest.spyOn(prisma.role, 'findMany').mockResolvedValue(mockRoles);

      const roles = await service.getAllRole();
      expect(roles).toEqual(mockRoles);
    });
  });

  describe('findIdRoleByUserId', () => {
    // Тестирование метода findIdRoleByUserId, проверка, что он возвращает правильный roleId для заданного userId
    it('should return the role ID for a given user ID', async () => {
      const userId = 1;
      const mockUserRole = { userId, roleId: 2 };
      jest.spyOn(prisma.userRole, 'findFirst').mockResolvedValue(mockUserRole);

      const roleId = await service.findIdRoleByUserId(userId);
      expect(roleId).toBe(mockUserRole.roleId);
    });

    // Тестирование, что метод возвращает null, если у пользователя нет роли
    it('should return null if the user has no role', async () => {
      jest.spyOn(prisma.userRole, 'findFirst').mockResolvedValue(null);

      const roleId = await service.findIdRoleByUserId(1);
      expect(roleId).toBeNull();
    });
  });

  describe('createRole', () => {
    // Тестирование метода createRole, проверка, что роль успешно создается и возвращается
    it('should create and return the new role', async () => {
      const dto = { roleName: 'user', description: 'User role' };
      const mockRole = { id: 1, ...dto };
      jest.spyOn(prisma.role, 'create').mockResolvedValue(mockRole);

      const role = await service.createRole(dto);
      expect(role).toEqual(mockRole);
    });
  });

  describe('addRoleToUser', () => {
    // Тестирование метода addRoleToUser, проверка, что связь между пользователем и ролью создается правильно
    it('should create and return the user-role relation', async () => {
      const userId = 1;
      const roleId = 2;
      const mockUserRole = { userId, roleId };
      jest.spyOn(prisma.userRole, 'create').mockResolvedValue(mockUserRole);

      const userRole = await service.addRoleToUser(userId, roleId);
      expect(userRole).toEqual(mockUserRole);
    });
  });

  describe('updateRoleToUser', () => {
    // Тестирование метода updateRoleToUser, проверка, что роль пользователя обновляется правильно
    it('should update the role of a user', async () => {
      const userId = 1;
      const oldRoleId = 2;
      const newRoleId = 3;

      // Мокаем методы findIdRoleByUserId, deleteRoleToUser и addRoleToUser
      jest.spyOn(service, 'findIdRoleByUserId').mockResolvedValue(oldRoleId);
      jest.spyOn(service, 'deleteRoleToUser').mockResolvedValue(null);
      jest
        .spyOn(service, 'addRoleToUser')
        .mockResolvedValue({ userId, roleId: newRoleId });

      const result = await service.updateRoleToUser(userId, newRoleId);
      expect(result).toEqual({ userId, roleId: newRoleId });
    });

    // Тестирование, что если у пользователя нет роли, добавляется новая роль
    it('should add a new role if the user has no role', async () => {
      const userId = 1;
      const newRoleId = 3;

      // Мокаем метод findIdRoleByUserId для возвращения null (роль не найдена)
      jest.spyOn(service, 'findIdRoleByUserId').mockResolvedValue(null);
      jest
        .spyOn(service, 'addRoleToUser')
        .mockResolvedValue({ userId, roleId: newRoleId });

      const result = await service.updateRoleToUser(userId, newRoleId);
      expect(result).toEqual({ userId, roleId: newRoleId });
    });
  });

  describe('deleteRoleToUser', () => {
    // Тестирование метода deleteRoleToUser, проверка, что связь между пользователем и ролью удаляется правильно
    it('should delete the user-role relation', async () => {
      const userId = 1;
      const roleId = 2;

      // Мокаем метод findIdRoleByUserId для возвращения roleId
      jest.spyOn(service, 'findIdRoleByUserId').mockResolvedValue(roleId);
      jest
        .spyOn(prisma.userRole, 'delete')
        .mockResolvedValue({ userId, roleId });

      const result = await service.deleteRoleToUser(userId);
      expect(result).toEqual({ userId, roleId });
    });

    // Тестирование, что выбрасывается ошибка, если у пользователя нет роли
    it('should throw an error if the user has no role', async () => {
      jest.spyOn(service, 'findIdRoleByUserId').mockResolvedValue(null);

      await expect(service.deleteRoleToUser(1)).rejects.toThrow(
        'User has no role to delete',
      );
    });
  });
});
