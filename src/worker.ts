//src\worker.ts
import mongoose from 'mongoose';
import { config } from './config/environment';
import { PinoLogger } from './adapters/driven/logger/PinoLogger';
import { OutboxWorker } from './adapters/driven/messaging/OutboxWorker';

const logger = new PinoLogger(config.logger.level);

async function startWorker() {
  try {
    logger.info('Connecting to MongoDB for worker...');
    await mongoose.connect(config.mongodb.uri);
    logger.info('MongoDB connected for worker');

    const outboxWorker = new OutboxWorker(
      config.rabbitmq.url,
      logger
    );

    await outboxWorker.start();
    logger.info('OutboxWorker started successfully');

    const shutdown = async () => {
      logger.info('Shutting down worker gracefully...');
      outboxWorker.stop();
      await mongoose.disconnect();
      logger.info('Worker shutdown complete.');
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start OutboxWorker', error as Error);
    process.exit(1);
  }
}

startWorker();
