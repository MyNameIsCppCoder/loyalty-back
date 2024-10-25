import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
const Base64 = require('js-base64').Base64;
import { sha1 } from 'js-sha1';
import { addMonths } from 'date-fns';
import { LoggingService } from '../logging/logging.service';
import { format } from 'date-fns';

@Injectable()
export class BankService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggingService: LoggingService,
  ) {}
  merchant = process.env.MERCHANT_KEY;
  secret = process.env.BANK_SECRET;
  success_url = process.env.SUCCESS_URL;
  testing = process.env.TESTING;
  getSignature(secretKey, formData) {
    // Формируем строку для подписи
    const values = Object.keys(formData)
      .filter(
        (key) =>
          key !== 'signature' && formData[key] !== '' && formData[key] != null,
      ) // Исключаем пустые значения, null, undefined и `signature`
      .sort() // Сортировка по алфавиту
      .map((key) => `${key}=${Base64.encode(String(formData[key]))}`) // Кодирование значений в base64 и приведение к строке
      .join('&');

    const firstHash = sha1(secretKey + values);

    const finalSignature = sha1(secretKey + firstHash);

    return finalSignature;
  }

  async getInfoStart(userId: number, months: number) {
    const unix_timestamp = Math.floor(Date.now() / 1000).toString();

    let amount: number;
    if (months === 3) {
      amount = 1425;
    } else if (months === 6) {
      amount = 2700;
    } else if (months === 12) {
      amount = 5100;
    } else if (months === 1) amount = 500;

    const purchase = await this.prisma.bank.create({
      data: {
        userId,
        amount,
        countMonth: months,
      },
    });

    const formattedDate = format(purchase.createdAt, 'yyyy-MM-dd');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const data = {
      merchant: this.merchant,
      amount: amount.toString(),
      order_id: purchase.id,
      description: `Покупка подписки "Стартовый" на ${months} месяцев`,
      success_url: `${this.success_url}/${purchase.id}/${months}/${formattedDate}`,
      testing: this.testing,
      receipt_contact: user.email,
      unix_timestamp: unix_timestamp,
      signature: '',
    };
    data.signature = this.getSignature(this.secret, data);
    return data;
  }

  async getInfoBusiness(userId: number, months: number) {
    const unix_timestamp = Math.floor(Date.now() / 1000).toString();

    let amount: number;
    if (months === 3) {
      amount = 2850;
    } else if (months === 6) {
      amount = 5400;
    } else if (months === 12) {
      amount = 9600;
    } else if (months === 1) amount = 1000;

    const purchase = await this.prisma.bank.create({
      data: {
        userId,
        amount,
        countMonth: months,
      },
    });
    const formattedDate = format(purchase.createdAt, 'yyyy-MM-dd');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const data = {
      merchant: this.merchant,
      amount: amount.toString(),
      order_id: purchase.id,
      description: `Покупка подписки "Бизнес" на ${months} месяцев`,
      success_url: `${this.success_url}/${purchase.id}/${months}/${formattedDate}`,
      testing: this.testing,
      receipt_contact: user.email,
      unix_timestamp: unix_timestamp,
      signature: '',
    };
    data.signature = this.getSignature(this.secret, data);
    return data;
  }

  async getInfoCorporate(userId: number, amount: number) {
    const unix_timestamp = Math.floor(Date.now() / 1000).toString();

    const purchase = await this.prisma.bank.create({
      data: {
        userId,
        amount,
        countMonth: amount,
      },
    });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const data = {
      merchant: this.merchant,
      amount: amount.toString(),
      order_id: purchase.id,
      description: 'Покупка подписки "Корпоративный"',
      success_url: `${this.success_url}/${purchase.id}`,
      testing: this.testing,
      receipt_contact: user.email,
      unix_timestamp: unix_timestamp,
      signature: '',
    };
    data.signature = this.getSignature(this.secret, data);
    return data;
  }

  async successPay(
    purchaseId: number,
    userId: number,
    countMouth: number,
    createdAt: string,
  ) {
    return this.prisma.$transaction(async () => {
      const tarrif = await this.prisma.user.update({
        where: { id: userId },
        data: { tarrifId: 1 },
      });
      const purchase = await this.prisma.bank.update({
        data: {
          isSuccess: 1,
          expiresAt: addMonths(new Date(createdAt), countMouth),
        },
        where: {
          id: purchaseId,
        },
      });
      return true;
    });
  }

  async getUsersWithExpiredSubscriptions() {
    const users = await this.prisma.user.findMany({
      where: {
        Bank: {
          some: {
            isSuccess: 1,
            expiresAt: {
              lt: new Date(),
            },
          },
        },
      },
      include: {
        Bank: true,
      },
    });

    return users;
  }

  async removeSubscribe() {
    const users = await this.getUsersWithExpiredSubscriptions();
    if (!users || users.length === 0) {
      await this.loggingService.logAction(0, 'DELETE', 'SUBSCRIBE', 0);
      return false;
    }

    const updatePromises = users.map((user) => {
      return this.prisma.bank.updateMany({
        where: { userId: user.id },
        data: {
          isSuccess: 0,
        },
      });
    });

    await Promise.all(updatePromises);
    await this.loggingService.logAction(
      0,
      'DELETE',
      `SUBSCRIBE`,
      updatePromises.length,
    );
    return true;
  }
}
