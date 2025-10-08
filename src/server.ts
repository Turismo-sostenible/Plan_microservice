import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import { config } from './config/environment';
import { PinoLogger } from './infrastructure/logger/PinoLogger';
import { RabbitMQPublisher } from './infrastructure/messaging/RabbitMQPublisher';
import { OutboxWorker } from './infrastructure/messaging/OutboxWorker';

const app = express();
const logger = new PinoLogger();

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar servicios
async function initializeServices() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(config.mongodb.uri);
    logger.info('Conectado a MongoDB', { uri: config.mongodb.uri });

    // Inicializar RabbitMQ Publisher
    const messageBus = new RabbitMQPublisher(config.rabbitmq.url, logger);
    await messageBus.connect();

    // Inicializar Outbox Worker
    const outboxWorker = new OutboxWorker(config.rabbitmq.url, logger);
    await outboxWorker.start();

    logger.info('Servicios inicializados correctamente');
  } catch (error) {
    logger.error('Error al inicializar servicios', error as Error);
    process.exit(1);
  }
}

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

// Manejo de errores
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error no manejado', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
async function startServer() {
  await initializeServices();
  
  app.listen(config.server.port, config.server.host, () => {
    logger.info('Servidor iniciado', {
      host: config.server.host,
      port: config.server.port,
      environment: process.env.NODE_ENV || 'development',
    });
  });
}

// Manejo de señales de cierre
process.on('SIGINT', async () => {
  logger.info('Cerrando servidor...');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Cerrando servidor...');
  await mongoose.disconnect();
  process.exit(0);
});

startServer().catch((error) => {
  logger.error('Error al iniciar servidor', error as Error);
  process.exit(1);
});
