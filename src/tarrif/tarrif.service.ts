import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TarrifCreateDTO, TarrifUpdateDTO } from '../dto/tarrif.dto';

@Injectable()
export class TarrifService {
  constructor(private readonly prisma: PrismaService) {}

  async showAllTarrif() {
    return this.prisma.tarrif.findMany();
  }

  async createTarrif(dto: TarrifCreateDTO) {
    return this.prisma.tarrif.create({ data: { ...dto } });
  }

  async updateTarrif(dto: TarrifUpdateDTO, tarrifId: number) {
    return this.prisma.tarrif.update({
      where: { id: tarrifId },
      data: { ...dto },
    });
  }

  async deleteTarrif(tarrifId: number) {
    return this.prisma.tarrif.delete({ where: { id: tarrifId } });
  }

  async addTarrifToUser(
    userId: number,
    tarrifId?: number,
    dto?: TarrifCreateDTO,
  ) {
    if (dto) {
      tarrifId = await this.prisma.tarrif
        .create({ data: { ...dto } })
        .then((tarrif) => tarrif.id);
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { tarrifId },
    });
  }
}
