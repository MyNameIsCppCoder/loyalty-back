import { IsNumber, IsOptional, IsString } from "class-validator";
import { RoleResponseDTO } from "./role.dto";


export class UserRoleDTO {
    @IsNumber()
    userId: number;

    @IsNumber()
    roleId: number;

    role: RoleResponseDTO;
}