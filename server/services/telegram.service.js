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

const clientCache = new Map();

export const getConnectedTelegramClient = async (userId, session = "") => {
  const cacheKey = userId.toString();
  const cached = clientCache.get(cacheKey);
  
  if (cached) {
    try {
      if (cached.connected) {
        return cached;
      }
      await cached.connect();
      return cached;
    } catch (err) {
      console.log(`Failed to reconnect cached client for user ${userId}, creating new one...`, err);
    }
  }

  const client = createTelegramClient(session);
  await client.connect();
  clientCache.set(cacheKey, client);
  return client;
};
