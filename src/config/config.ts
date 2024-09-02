import { configDotenv } from 'dotenv';

export default class Config {
  constructor() {
    // Загружаем переменные окружения при инициализации класса
    configDotenv();
  }

  getJWT() {
    // Получаем значение переменной окружения JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET is not defined in the environment variables.',
      );
    }

    return jwtSecret;
  }
}
