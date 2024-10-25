export interface sendMessageDto {
  to: string;
  message: string;
}

export interface sendVerifyDto {
  to: string;
  secretNumber: number;
}
