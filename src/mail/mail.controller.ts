import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { MailService } from './mail.service';
import { sendMessageDto, sendVerifyDto } from '../dto/mailer.dto';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  async sendMail(@Body() dto: sendMessageDto) {
    return await this.mailService.sendMail(dto.message, dto.to);
  }

  @Post('verify')
  async sendVerify(@Body() dto: sendVerifyDto) {
    return await this.mailService.sendMailWithVerification(
      +dto.secretNumber,
      dto.to,
    );
  }

  @Get('change-pass/:secretNumber/')
  async changePass(
    @Req() req: any,
    @Param('secretNumber') secretNumber: string,
  ) {
    return await this.mailService.sendMailByChangPass(
      +secretNumber,
      +req.user.userId,
    );
  }
}
