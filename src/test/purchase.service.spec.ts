import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseService } from '../purchase/purchase.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Purchase, Client, CashBackTransaction, Visit } from '@prisma/client';
import { jest, expect, describe, it, beforeEach } from '@jest/globals';

describe('PurchaseService', () => {
  let service: PurchaseService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseService,
        {
          provide: PrismaService,
          useValue: {
            purchase: {
              create: jest.fn(),
              findMany: jest.fn(),
              delete: jest.fn(),
            },
            client: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
            },
            visit: {
              create: jest.fn(),
            },
            cashBackTransaction: {
              create: jest.fn(),
            },
            $transaction: jest
              .fn()
              .mockImplementation(async (callback: any) => {
                return callback(prisma);
              }),
          },
        },
      ],
    }).compile();

    service = module.get<PurchaseService>(PurchaseService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPurchase', () => {
    it('should create a purchase, visit, and cashback transaction', async () => {
      const clientId = 1;
      const userId = 1;
      const purchaseAmount = 100;

      const visit: Visit = {
        id: 1,
        clientId,
        visitDate: new Date(),
      };

      const purchase: Purchase = {
        id: 1,
        clientId,
        userId,
        visitId: visit.id,
        amount: purchaseAmount,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const client: Client = {
        id: clientId,
        name: 'Test Client',
        phone: '1234567890',
        email: 'test@example.com',
        birthDate: new Date(),
        cashbackPercentage: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.visit, 'create').mockResolvedValue(visit);
      jest.spyOn(prisma.purchase, 'create').mockResolvedValue(purchase);
      jest.spyOn(prisma.client, 'findFirst').mockResolvedValue(client);
      jest.spyOn(prisma.cashBackTransaction, 'create').mockResolvedValue({
        id: 1,
        clientId: client.id,
        amount: (purchaseAmount * client.cashbackPercentage) / 100,
        createdAt: new Date(),
      } as CashBackTransaction);

      const result = await service.createPurchase(
        clientId,
        userId,
        purchaseAmount,
      );

      expect(prisma.visit.create).toHaveBeenCalledWith({ data: { clientId } });
      expect(prisma.purchase.create).toHaveBeenCalledWith({
        data: {
          userId,
          clientId,
          amount: purchaseAmount,
          visitId: visit.id,
        },
        include: { visit: true },
      });
      expect(prisma.cashBackTransaction.create).toHaveBeenCalledWith({
        data: {
          client: {
            connect: { id: client.id },
          },
          amount: (purchaseAmount * client.cashbackPercentage) / 100,
        },
      });
      expect(result).toEqual(purchase);
    });

    it('should throw NotFoundException if client is not found', async () => {
      jest.spyOn(prisma.client, 'findFirst').mockResolvedValue(null);

      await expect(service.createPurchase(1, 1, 100)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deletePurchaseById', () => {
    it('should delete a purchase and create a negative cashback transaction', async () => {
      const purchaseId = 1;
      const purchase: Purchase = {
        id: purchaseId,
        clientId: 1,
        userId: 1,
        visitId: 1,
        amount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const client: Client = {
        id: 1,
        name: 'Test Client',
        phone: '1234567890',
        email: 'test@example.com',
        birthDate: new Date(),
        cashbackPercentage: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.purchase, 'delete').mockResolvedValue(purchase);
      jest.spyOn(prisma.client, 'findFirst').mockResolvedValue(client);
      jest.spyOn(prisma.cashBackTransaction, 'create').mockResolvedValue({
        id: 1,
        clientId: client.id,
        amount: -(purchase.amount * client.cashbackPercentage) / 100,
        createdAt: new Date(),
      } as CashBackTransaction);

      const result = await service.deletePurchaseById(purchaseId);

      expect(prisma.purchase.delete).toHaveBeenCalledWith({
        where: { id: purchaseId },
        select: { userId: true, amount: true },
      });
      expect(prisma.cashBackTransaction.create).toHaveBeenCalledWith({
        data: {
          client: {
            connect: { id: client.id },
          },
          amount: -(purchase.amount * client.cashbackPercentage) / 100,
        },
      });
      expect(result).toEqual(purchase);
    });

    it('should throw NotFoundException if client is not found', async () => {
      jest.spyOn(prisma.client, 'findFirst').mockResolvedValue(null);

      await expect(service.deletePurchaseById(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancelPurchaseById', () => {
    it('should cancel a purchase and create a negative cashback transaction', async () => {
      const purchaseId = 1;
      const purchase: Purchase = {
        id: purchaseId,
        clientId: 1,
        userId: 1,
        visitId: 1,
        amount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const client: Client = {
        id: 1,
        name: 'Test Client',
        phone: '1234567890',
        email: 'test@example.com',
        birthDate: new Date(),
        cashbackPercentage: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.purchase, 'delete').mockResolvedValue(purchase);
      jest.spyOn(prisma.client, 'findFirst').mockResolvedValue(client);
      jest.spyOn(prisma.cashBackTransaction, 'create').mockResolvedValue({
        id: 1,
        clientId: client.id,
        amount: -(purchase.amount * client.cashbackPercentage) / 100,
        createdAt: new Date(),
      } as CashBackTransaction);

      const result = await service.cancelPurchaseById(purchaseId);

      expect(prisma.purchase.delete).toHaveBeenCalledWith({
        where: { id: purchaseId },
        select: { userId: true, amount: true },
      });
      expect(prisma.cashBackTransaction.create).toHaveBeenCalledWith({
        data: {
          client: {
            connect: { id: client.id },
          },
          amount: -(purchase.amount * client.cashbackPercentage) / 100,
        },
      });
      expect(result).toEqual(purchase);
    });

    it('should throw NotFoundException if client is not found', async () => {
      jest.spyOn(prisma.client, 'findFirst').mockResolvedValue(null);

      await expect(service.cancelPurchaseById(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
