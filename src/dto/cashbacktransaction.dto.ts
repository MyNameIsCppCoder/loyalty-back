import { IsNumber, IsDate } from 'class-validator';

export class CashBackTransactionCreateDTO {
  @IsNumber()
  clientId: number;

  @IsNumber()
  amount: number;
}

export class CashBackTransactionResponseDTO {
  @IsNumber()
  id: number;

  @IsNumber()
  clientId: number;

  @IsNumber()
  amount: number;

  @IsDate()
  createdAt: Date;
}
