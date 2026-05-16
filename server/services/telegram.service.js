import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import dotenv from "dotenv";
dotenv.config();
const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;

export const createTelegramClient = (session = "") =>{
    const stringSession = new StringSession(session);
    return new TelegramClient(
        stringSession , 
        apiId,
        apiHash,
        {
            connectionRetries : 5,
            useWSS : false,
        }
    )
}
