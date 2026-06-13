import dotenv from "dotenv";

dotenv.config();

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

const client = new TelegramClient(
  new StringSession(""),
  Number(process.env.API_ID),
  process.env.API_HASH,
  {
    connectionRetries: 5,
    useWSS: false,
  },
);

(async () => {
  try {
    await client.connect();

    console.log("CONNECTED");
  } catch (err) {
    console.log(err);
  }
})();
