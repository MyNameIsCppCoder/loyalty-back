import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TarrifService } from './tarrif.service';
import { TarrifCreateDTO, TarrifUpdateDTO } from '../dto/tarrif.dto';
import { JwtAuth } from '../guards/authGuar.jwt';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorators';

@UseGuards(JwtAuth, RolesGuard)
@Controller('tarrif')
export class TarrifController {
  constructor(private readonly tarrifService: TarrifService) {}

  @Post('create/')
  @Roles('admin')
  async createTarrif(@Body() dto: TarrifCreateDTO) {
    return await this.tarrifService.createTarrif(dto);
  }

  @Put('update/')
  @Roles('admin')
  async updateTarrif(
    @Body() dto: TarrifUpdateDTO,
    @Query('tarrifId') tarrifId: number,
  ) {
    return await this.tarrifService.updateTarrif(dto, tarrifId);
  }

  @Delete('delete/')
  @Roles('admin')
  async deleteTarrif(@Query('tarrifId') tarrifId: number) {
    return await this.tarrifService.deleteTarrif(tarrifId);
  }

  @Put('add/')
  @Roles('admin')
  async addTarrifToUser(
    @Req() req: any,
    @Body() dto?: TarrifCreateDTO,
    @Query('tarrifId') tarrifId?: string,
  ) {
    return await this.tarrifService.addTarrifToUser(
      +req.user.userId,
      +tarrifId,
      dto,
    );
  }

  @Get('show/')
  @Roles('admin')
  async showAllTarrifs() {
    return await this.tarrifService.showAllTarrif();
  }
}
