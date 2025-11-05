import * as amqp from 'amqplib';
import { MessageBusPort } from '../../../application/ports/MessageBusPort';
import { LoggerPort } from '../../../application/ports/LoggerPort';
import { OutboxModel } from '../persistence/mongoose/models/OutboxModel';
import {ChannelModel} from "amqplib";

export class RabbitMQPublisher implements MessageBusPort {
  private connection: ChannelModel | null | undefined;
  private channel: amqp.Channel | null = null;
  private readonly exchangeName = 'plans.events';

  constructor(
    private readonly rabbitUrl: string,
    private readonly logger: LoggerPort
  ) {}

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.rabbitUrl);
      this.channel = await this.connection.createChannel();

      // Crear exchange tipo topic
      await this.channel!.assertExchange(this.exchangeName, 'topic', {
        durable: true,
      });

      this.logger.info('Conectado a RabbitMQ', {
        exchange: this.exchangeName,
      });
    } catch (error) {
      this.logger.error('Error al conectar con RabbitMQ', error as Error);
      throw error;
    }
  }

  async publish(routingKey: string, message: any): Promise<void> {
    try {
      if (this.channel) {
        const published = this.channel.publish(
          this.exchangeName,
          routingKey,
          Buffer.from(JSON.stringify(message)),
          { persistent: true }
        );

        if (published) {
          this.logger.info('Evento publicado en RabbitMQ', {
            routingKey,
            messageId: message.data?.planId,
          });
          return;
        }
      }

      this.logger.warn('Publicación directa falló, guardando en Outbox', {
        routingKey,
        reason: this.channel
          ? 'Backpressure on publish'
          : 'Channel not available',
      });
      await this.saveToOutbox(routingKey, message);
    } catch (error) {
      this.logger.error(
        'Error inesperado durante la publicación, guardando en Outbox',
        error as Error,
        { routingKey }
      );
      await this.saveToOutbox(routingKey, message);
    }
  }

  private async saveToOutbox(routingKey: string, message: any): Promise<void> {
    await OutboxModel.create({
      routingKey,
      payload: message,
      status: 'PENDING',
      attempts: 0,
      createdAt: new Date(),
    });

    this.logger.info('Evento guardado en Outbox', { routingKey });
  }

  async subscribe(
    routingKey: string,
    handler: (message: any) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Canal no inicializado');
    }

    const queueName = `plans-service.${routingKey}`;
    await this.channel.assertQueue(queueName, { durable: true });
    await this.channel.bindQueue(queueName, this.exchangeName, routingKey);

    await this.channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const message = JSON.parse(msg.content.toString());
        await handler(message);
        this.channel!.ack(msg);
        this.logger.info('Mensaje procesado', { routingKey });
      } catch (error) {
        this.logger.error('Error al procesar mensaje', error as Error, { routingKey });
        this.channel!.nack(msg, false, false); // No requeue, enviar a DLQ
      }
    });

    this.logger.info('Suscrito a eventos', { routingKey, queueName });
  }

  async close(): Promise<void> {
    await (this.channel as any)?.close();
    await (this.connection as any)?.close();
    this.logger.info('Conexión a RabbitMQ cerrada');
  }
}
