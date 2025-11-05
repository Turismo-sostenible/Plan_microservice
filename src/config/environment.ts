// src/config/environment.ts

import "dotenv/config";

export const config = {
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    host: process.env.HOST || "0.0.0.0",
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3001",
  },
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/plans_service",
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || "amqp://localhost",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "supersecretkey",
  },
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },
  storage: {
    local: {
      path: process.env.STORAGE_PATH || "./uploads",
    },
  },
};
