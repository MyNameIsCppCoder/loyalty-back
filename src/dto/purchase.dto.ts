import { IsDate, IsNumber } from 'class-validator';
import { ClientResponseDTO } from './client.dto';
export class PurchaseCreateDto {
  @IsNumber()
  clientId: number;

  @IsNumber()
  userId: number;

  @IsNumber()
  amount: number;
}

export class PurchaseResponseDto {
  @IsNumber()
  id: number;

  @IsNumber()
  userId: number;

  @IsNumber()
  clientId: number;

  @IsNumber()
  amount: number;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  client: ClientResponseDTO;
}
