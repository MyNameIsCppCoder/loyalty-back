import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MailerService } from '@nestjs-modules/mailer';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class MailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailerService,
    private readonly loggingService: LoggingService,
  ) {}

  async sendMail(message: string, to: string) {
    const res = this.mailService.sendMail({
      from: 'businesstools <businesstools-info@yandex.ru>',
      to,
      subject: `How to Send Emails with Nodemailer`,
      text: message,
    });
  }

  async sendMailWithVerification(secretNumber: number, to: string) {
    const res = this.mailService.sendMail({
      to,
      from: 'businesstools <businesstools-info@yandex.ru>',
      subject: `Подтверждение почти`,
      text: `Ваш код подтверждения: ${secretNumber}`,
    });
    this.loggingService.logAction(0, 'MAIL', 'VERIFICATION', 0);
  }

  async sendMailByChangPass(secretNumber: number, id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    this.mailService.sendMail({
      from: 'businesstools <businesstools-info@yandex.ru>',
      to: user.email,
      subject: `How to Send Emails with Nodemailer`,
      text: `Ваш код подтверждения: ${secretNumber}`,
    });
    this.loggingService.logAction(0, 'MAIL', 'CHANGE PASS', 0);
  }
}
