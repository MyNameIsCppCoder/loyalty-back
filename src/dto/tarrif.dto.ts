import { IsNumber, IsOptional, IsString } from "class-validator";
import { UserResponseDTO } from "./user.dto";

export class TarrifCreateDTO {
    @IsString()
    name: string;

    @IsNumber()
    price: number;

    @IsNumber()
    maxClient: number;
}

export class TarrifUpdateDTO {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsNumber()
    price?: number;

    @IsOptional()
    @IsNumber()
    maxClient?: number;
}

export class TarrifResponseDTO {
    @IsNumber()
    id: number;

    @IsString()
    name: string;

    @IsNumber()
    price: number;

    @IsNumber()
    maxClient: number;
    
    users: UserResponseDTO[];
}