import {
  IsString,
  IsOptional,
  IsNumber,
  IsDate,
  IsEmail,
} from 'class-validator';
import { RoleResponseDTO } from './role.dto';
import { ClientResponseDTO } from './client.dto';

export class CreateUserDTO {
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsNumber()
  tarrifId?: number;

  @IsEmail()
  email: string;
}

export class LoginUserDTO {
  @IsString()
  password: string;

  @IsEmail()
  email: string;
}

export class UpdateUserDTO {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  passwordHash?: string;

  @IsOptional()
  @IsNumber()
  tarrifId?: number;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UserResponseDTO {
  @IsNumber()
  id?: number;

  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  @IsOptional()
  @IsNumber()
  tarrifId?: number;

  @IsOptional()
  @IsEmail()
  email?: string;

  roles: RoleResponseDTO[];

  clients: ClientResponseDTO[];
}
