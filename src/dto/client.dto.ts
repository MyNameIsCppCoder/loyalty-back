import {
  IsOptional,
  IsString,
  IsNumber,
  IsEmail,
  IsDate,
} from 'class-validator';
import { PurchaseResponseDto } from './purchase.dto';
import { VisitResponseDTO } from './visit.dto';
import { CashBackTransactionResponseDTO } from './cashbacktransaction.dto';
export class ClientCreateDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsNumber()
  cashbackPercentage?: number = 0;
}

export class ClientUpdateDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsNumber()
  cashbackPercentage?: number = 0;
}

export class ClientResponseDTO {
  @IsNumber()
  id: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsNumber()
  cashbackPercentage: number;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  purchases: PurchaseResponseDto[];
  visits: VisitResponseDTO[];
  transactions: CashBackTransactionResponseDTO[];
}
