import express from "express";
import mongoose from "mongoose";
import path from "path";
import { config } from "./config/environment";
import { logger, planController, messageBus } from "./config/dependencies";
import { createPlanRoutes } from "./adapters/driving/http/routes/planRoutes";
import { OutboxWorker } from "./adapters/driven/messaging/OutboxWorker";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./adapters/driving/http/swagger/swagger";
import crypto from "crypto";
import cors from "cors";

const app = express();

// Configuración de CORS
const corsOptions = {
  origin: config.server.corsOrigin,
  optionsSuccessStatus: 200, // Para navegadores antiguos
};
app.use(cors(corsOptions));

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Inyectar logger en cada request
app.use((req, res, next) => {
  req.logger = logger.child({ requestId: crypto.randomUUID() });
  next();
});

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
app.use("/api/v1", createPlanRoutes(planController));

// Ruta de salud
app.get("/health", (req, res) => {
  const isHealthy = mongoose.connection.readyState === 1;
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "OK" : "DEGRADED",
    timestamp: new Date().toISOString(),
    services: {
      mongodb:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    },
  });
});

// Manejo de errores centralizado (debe ir después de las rutas)
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    req.logger.error("Error no manejado", err);
    res.status(500).json({ message: "Error interno del servidor" });
  },
);

// Iniciar servidor y servicios
async function startServer() {
  let outboxWorker: OutboxWorker | null = null;
  let server: any = null;

  try {
    // Validar configuración
    if (!config.mongodb.uri) throw new Error("MONGODB_URI requerida");
    if (!config.rabbitmq.url) throw new Error("RABBITMQ_URL requerida");

    // 1. MongoDB
    await mongoose.connect(config.mongodb.uri);
    logger.info("MongoDB conectado");

    // Manejar desconexiones
    mongoose.connection.on("disconnected", () => {
      logger.error("MongoDB desconectado");
    });

    // 2. RabbitMQ
    await messageBus.connect();
    logger.info("RabbitMQ conectado");

    // 3. Outbox Worker
    outboxWorker = new OutboxWorker(config.rabbitmq.url, logger);
    await outboxWorker.start();
    logger.info("OutboxWorker iniciado");

    // 4. Express (solo después de que todo esté listo)
    server = app.listen(config.server.port, config.server.host, () => {
      logger.info("Servidor listo", {
        host: config.server.host,
        port: config.server.port,
        environment: process.env.NODE_ENV || "development",
      });
    });

    // Graceful shutdown con timeout
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Señal ${signal} recibida. Cerrando...`);

      const shutdownTimeout = setTimeout(() => {
        logger.error("Forzando salida por timeout");
        process.exit(1);
      }, 30000);

      try {
        if (server) {
          await new Promise<void>((resolve) => server.close(() => resolve()));
          logger.info("HTTP cerrado");
        }

        await mongoose.disconnect();
        logger.info("MongoDB desconectado");

        await messageBus.close();
        logger.info("RabbitMQ cerrado");

        if (outboxWorker) outboxWorker.stop();
        logger.info("OutboxWorker detenido");

        clearTimeout(shutdownTimeout);
        process.exit(0);
      } catch (error) {
        logger.error("Error durante shutdown", error as Error);
        process.exit(1);
      }
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  } catch (error) {
    logger.error("Error fatal al iniciar", error as Error);

    // Cleanup en caso de error
    if (outboxWorker) outboxWorker.stop();
    if (messageBus) await messageBus.close().catch(() => {});
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();

    process.exit(1);
  }
}

startServer();
