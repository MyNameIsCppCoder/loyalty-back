import { IsString, IsOptional, IsNumber } from 'class-validator';

export class RoleCreateDTO {
  @IsString()
  roleName: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class RoleUpdateDTO {
  @IsOptional()
  @IsString()
  roleName?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class RoleResponseDTO {
  @IsNumber()
  id: number;

  @IsNumber()
  roleName: string;

  @IsOptional()
  @IsNumber()
  description?: string;
}
