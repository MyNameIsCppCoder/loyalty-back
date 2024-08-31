import { configDotenv } from "dotenv";



export default class Config {
    async getJWT() {
        let key = configDotenv();
        key.parsed;
    }
}