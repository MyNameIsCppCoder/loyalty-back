import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma.service';
import { CreateUserDTO, UpdateUserDTO } from '../dto/user.dto';
import { hash } from 'argon2';

jest.mock('argon2'); // Мокируем библиотеку argon2, чтобы избежать реального хэширования и проверки паролей.

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, PrismaService], // Подключаем сервисы UserService и PrismaService.
    }).compile();

    service = module.get<UserService>(UserService); // Получаем инстанс UserService.
    prisma = module.get<PrismaService>(PrismaService); // Получаем инстанс PrismaService.
  });

  it('should be defined', () => {
    // Проверяем, что сервис был определен и успешно инициализирован.
    expect(service).toBeDefined();
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      // Подготавливаем пользователя для мокирования.
      const userId = 1;
      const mockUser = {
        id: userId,
        username: 'user1',
        name: 'User One',
        passwordHash: 'hashedpassword',
        email: 'user1@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        tarrifId: 1,
      };

      // Мокируем метод findUnique Prisma, чтобы он возвращал mockUser.
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      // Вызываем метод сервиса и проверяем, что он возвращает пользователя mockUser.
      const user = await service.getUserById(userId);
      expect(user).toEqual(mockUser);
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user by email', async () => {
      // Подготавливаем пользователя для мокирования.
      const email = 'user1@example.com';
      const mockUser = {
        id: 1,
        username: 'user1',
        name: 'User One',
        passwordHash: 'hashedpassword',
        email: email,
        createdAt: new Date(),
        updatedAt: new Date(),
        tarrifId: 1,
      };

      // Мокируем метод findFirst Prisma, чтобы он возвращал mockUser.
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(mockUser);

      // Вызываем метод сервиса и проверяем, что он возвращает пользователя mockUser.
      const user = await service.getUserByEmail(email);
      expect(user).toEqual(mockUser);
    });
  });

  describe('getUserByIdWithClients', () => {
    it('should return a user with clients by id', async () => {
      // Подготавливаем пользователя с клиентами для мокирования.
      const userId = 1;
      const mockUser = {
        id: userId,
        username: 'user1',
        name: 'User One',
        passwordHash: 'hashedpassword',
        email: 'user1@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        tarrifId: 1,
        clients: [{ id: 1, name: 'client1' }],
      };

      // Мокируем метод findUnique Prisma, чтобы он возвращал mockUser.
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      // Вызываем метод сервиса и проверяем, что он возвращает пользователя с клиентами.
      const user = await service.getUserByIdWithClients(userId);
      expect(user).toEqual(mockUser);
    });
  });

  describe('createUser', () => {
    it('should create and return the new user', async () => {
      // Подготавливаем данные для создания нового пользователя.
      const dto: CreateUserDTO = {
        username: 'user1',
        name: 'User One',
        password: 'password123',
        tarrifId: 1,
        email: 'user1@example.com',
      };

      const mockHashedPassword = 'hashedpassword';
      const mockUser = {
        id: 1,
        username: dto.username,
        name: dto.name,
        passwordHash: mockHashedPassword,
        email: dto.email,
        createdAt: new Date(),
        updatedAt: new Date(),
        tarrifId: dto.tarrifId || 1,
      };

      // Мокируем функцию хэширования, чтобы она возвращала mockHashedPassword.
      (hash as jest.Mock).mockResolvedValue(mockHashedPassword);
      // Мокируем метод create Prisma, чтобы он возвращал mockUser.
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);

      // Вызываем метод сервиса и проверяем, что пользователь был создан и возвращен.
      const user = await service.createUser(dto);
      expect(user).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should update and return the user', async () => {
      // Подготавливаем данные для обновления пользователя.
      const userId = 1;
      const dto: UpdateUserDTO = { username: 'user1_updated' };
      const mockUser = {
        id: userId,
        username: dto.username,
        name: 'User One Updated',
        passwordHash: 'hashedpassword',
        email: 'user1@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        tarrifId: 1,
      };

      // Мокируем метод update Prisma, чтобы он возвращал обновленного пользователя.
      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUser);

      // Вызываем метод сервиса и проверяем, что пользователь был обновлен и возвращен.
      const updatedUser = await service.updateUser(userId, dto);
      expect(updatedUser).toEqual(mockUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete and return the user', async () => {
      // Подготавливаем пользователя для удаления.
      const userId = 1;
      const mockUser = {
        id: userId,
        username: 'user1',
        name: 'User One',
        passwordHash: 'hashedpassword',
        email: 'user1@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        tarrifId: 1,
      };

      // Мокируем метод delete Prisma, чтобы он возвращал удаленного пользователя.
      jest.spyOn(prisma.user, 'delete').mockResolvedValue(mockUser);

      // Вызываем метод сервиса и проверяем, что пользователь был удален и возвращен.
      const deletedUser = await service.deleteUser(userId);
      expect(deletedUser).toEqual(mockUser);
    });
  });

  describe('getAllUsers', () => {
    it('should return an array of users', async () => {
      // Подготавливаем массив пользователей для мокирования.
      const mockUsers = [
        {
          id: 1,
          username: 'user1',
          name: 'User One',
          passwordHash: 'hashedpassword',
          email: 'user1@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
          tarrifId: 1,
        },
      ];

      // Мокируем метод findMany Prisma, чтобы он возвращал mockUsers.
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue(mockUsers);

      // Вызываем метод сервиса и проверяем, что он возвращает массив mockUsers.
      const users = await service.getAllUsers();
      expect(users).toEqual(mockUsers);
    });
  });
});
