import { IsDate, IsNumber, IsString } from 'class-validator';

export class LogCreateDTO {
  @IsNumber()
  userId: number;

  @IsString()
  action: string;

  @IsString()
  entity: string;

  @IsNumber()
  entityId: number;
}

export class LogResponseDTO {
    @IsNumber()
    id: number;

    @IsNumber()
    userId: number;

    @IsString()
    action: string;

    @IsString()
    entity: string;

    @IsNumber()
    entityId: number;

    @IsDate()
    timeStamp: Date;
  }