"use strict";

import dotenv from "dotenv";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export default {
  NETWORK: {
    ETH: {
      RPC_API: process.env.RPC_API,
    },
  },

  DATABASE: {
    MONGO: {
      URI: process.env.MONGO_URI,
    },
  },

  LOGGER: {
    LEVEL: process.env.LOG_LEVEL || "debug",
  },

  API_KEY: process.env.API_KEY,

  // admin id
  ADMIN_ID: process.env.ADMIN_ID,
  // admin password
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,

  // jwt secret
  ADMSTR_SECRET: process.env.ADMSTR_SECRET,
  ADMSTR_REFRESH_SECRET: process.env.ADMSTR_REFRESH_SECRET,
  ADMIN_SECRET: process.env.ADMIN_JWT_SECRET,
  ADMIN_REFRESH_SECRET: process.env.ADMIN_REFRESH_SECRET,
  USER_SECRET: process.env.USER_JWT_SECRET,
  USER_REFRESH_SECRET: process.env.USER_REFRESH_JWT_SECRET,
  ROOT_ADMINS: process.env.ROOT_ADMINS,
  ROOT_ADMINS_DOMAINS: process.env.ROOT_ADMINS_DOMAINS,

  // frontend base url
  FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL,

  // email (smtp)
  EMAIL: {
    USER: process.env.EMAIL_USER,
    PASS: process.env.EMAIL_PASS,
  },

  // mongo field encryption
  MONGO_FIELD_SECRET: process.env.MONGO_FIELD_SECRET,
};
