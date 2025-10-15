import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import { config } from './config/environment';
import { logger, planController, messageBus } from './config/dependencies';
import { createPlanRoutes } from './adapters/http/routes/planRoutes';
import { OutboxWorker } from './infrastructure/messaging/OutboxWorker';

const app = express();

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inyectar logger en cada request
app.use((req, res, next) => {
  req.logger = logger.child({ requestId: crypto.randomUUID() });
  next();
});

// Rutas
const planRoutes = createPlanRoutes(planController);
app.use('/api/v1', planRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    }
  });
});

// Manejo de errores centralizado (debe ir después de las rutas)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  req.logger.error('Error no manejado', err);
  res.status(500).json({ message: 'Error interno del servidor' });
});


// Iniciar servidor y servicios
async function startServer() {
  try {
    // 1. Conectar a MongoDB
    await mongoose.connect(config.mongodb.uri);
    logger.info('Conectado a MongoDB');

    // 2. Conectar a RabbitMQ
    await messageBus.connect();

    // 3. Iniciar Outbox Worker
    const outboxWorker = new OutboxWorker(config.rabbitmq.url, logger);
    await outboxWorker.start();

    // 4. Iniciar servidor Express
    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info('Servidor iniciado', {
        host: config.server.host,
        port: config.server.port,
        environment: process.env.NODE_ENV || 'development',
      });
    });

    // Manejo de señales de cierre
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Recibida señal ${signal}. Cerrando servidor...`);
      server.close(async () => {
        logger.info('Servidor HTTP cerrado.');
        await mongoose.disconnect();
        logger.info('Desconectado de MongoDB.');
        await messageBus.close();
        outboxWorker.stop();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    logger.error('Error al iniciar el servidor', error as Error);
    process.exit(1);
  }
}

startServer();