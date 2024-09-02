import { Test, TestingModule } from '@nestjs/testing';
import { VisitService } from '../visit/visit.service';
import { PrismaService } from '../prisma.service';
import { Visit } from '@prisma/client';
import { jest, expect, describe, beforeEach, it } from '@jest/globals';

describe('VisitService', () => {
  let service: VisitService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitService,
        {
          provide: PrismaService,
          useValue: {
            visit: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<VisitService>(VisitService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllVisits', () => {
    it('should return an array of visits', async () => {
      const visits: Visit[] = [
        {
          id: 1,
          clientId: 1,
          visitDate: new Date(),
        },
      ];

      jest.spyOn(prisma.visit, 'findMany').mockResolvedValue(visits);

      const result = await service.getAllVisits();
      expect(result).toEqual(visits);
      expect(prisma.visit.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllVisitsByClientId', () => {
    it('should return an array of visits for a specific client and user', async () => {
      const clientId = 1;
      const userId = 1;
      const visits: Visit[] = [
        {
          id: 1,
          clientId,
          visitDate: new Date(),
        },
      ];

      jest.spyOn(prisma.visit, 'findMany').mockResolvedValue(visits);

      const result = await service.getAllVisitsByClientId(clientId, userId);
      expect(result).toEqual(visits);
      expect(prisma.visit.findMany).toHaveBeenCalledWith({
        where: {
          clientId,
          client: {
            userClient: {
              some: { userId },
            },
          },
        },
      });
    });

    it('should return an empty array if no visits are found', async () => {
      const clientId = 1;
      const userId = 1;

      jest.spyOn(prisma.visit, 'findMany').mockResolvedValue([]);

      const result = await service.getAllVisitsByClientId(clientId, userId);
      expect(result).toEqual([]);
      expect(prisma.visit.findMany).toHaveBeenCalledWith({
        where: {
          clientId,
          client: {
            userClient: {
              some: { userId },
            },
          },
        },
      });
    });
  });

  describe('getAllVisitsByUserId', () => {
    it('should return an array of visits for clients associated with the user', async () => {
      const userId = 1;
      const visits: Visit[] = [
        {
          id: 1,
          clientId: 1,
          visitDate: new Date(),
        },
      ];

      jest.spyOn(prisma.visit, 'findMany').mockResolvedValue(visits);

      const result = await service.getAllVisitsByUserId(userId);
      expect(result).toEqual(visits);
      expect(prisma.visit.findMany).toHaveBeenCalledWith({
        where: {
          client: {
            userClient: { some: { userId } },
          },
        },
      });
    });

    it('should return an empty array if no visits are found for the user', async () => {
      const userId = 1;

      jest.spyOn(prisma.visit, 'findMany').mockResolvedValue([]);

      const result = await service.getAllVisitsByUserId(userId);
      expect(result).toEqual([]);
      expect(prisma.visit.findMany).toHaveBeenCalledWith({
        where: {
          client: {
            userClient: { some: { userId } },
          },
        },
      });
    });
  });
});
