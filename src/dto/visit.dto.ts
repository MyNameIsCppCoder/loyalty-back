import { IsNumber, IsDate } from 'class-validator';

export class VisitCreateDTO {
  @IsNumber()
  clientId: number;

  @IsDate()
  visitDate: Date;
}

export class VisitResponseDTO {
  @IsNumber()
  id: number;

  @IsNumber()
  clientId: number;

  @IsDate()
  visitDate: Date;
}
