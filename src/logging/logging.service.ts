import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class LoggingService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(
    userId: number,
    action: string,
    entity: string,
    entityId: number,
  ): Promise<void> {
    try {
      await this.prisma.log.create({
        data: {
          userId,
          action,
          entity,
          entityId,
        },
      });
    } catch (error) {
      // Обработка ошибок при записи логов
      console.error('Ошибка при записи лога:', error);
      // Решите, нужно ли выбрасывать исключение или просто логировать ошибку
    }
  }
}
