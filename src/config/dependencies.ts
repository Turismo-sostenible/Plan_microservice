// src/config/dependencies.ts

import { CreatePlanUseCase } from '../application/use-cases/CreatePlanUseCase';
import { PlanController } from '../adapters/http/controllers/PlanController';
import { MongoPlanRepository } from '../infrastructure/persistence/mongoose/MongoPlanRepository';
import { LocalImageStorage } from '../infrastructure/storage/LocalImageStorage';
import { RabbitMQPublisher } from '../infrastructure/messaging/RabbitMQPublisher';
import { PinoLogger } from '../infrastructure/logger/PinoLogger';
import { config } from './environment';

// Logger
export const logger = new PinoLogger(config.logger.level);

// Repositories
export const planRepository = new MongoPlanRepository();

// Storage
export const imageStorage = new LocalImageStorage(config.storage.local.path, logger);

// Message Bus
export const messageBus = new RabbitMQPublisher(config.rabbitmq.url, logger);

// Use Cases
export const createPlanUseCase = new CreatePlanUseCase(
  planRepository,
  imageStorage,
  messageBus,
  logger
);

// Controllers
export const planController = new PlanController(createPlanUseCase);