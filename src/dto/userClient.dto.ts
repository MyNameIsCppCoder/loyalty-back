import { IsNumber } from 'class-validator';
import { ClientResponseDTO } from './client.dto';

export class UserClientDTO {
  @IsNumber()
  userId: number;

  @IsNumber()
  clientId: number;

  client: ClientResponseDTO;
}
