import { OutboxModel } from '../persistence/mongoose/models/OutboxModel'
import { LoggerPort } from '../../../application/ports/LoggerPort'
import * as amqp from 'amqplib'
import {ChannelModel} from "amqplib";

export class OutboxWorker {
  private intervalId: NodeJS.Timeout | null = null
  private connection: ChannelModel | null | undefined
  private channel: amqp.Channel | null = null

  constructor(
    private readonly rabbitUrl: string,
    private readonly logger: LoggerPort,
    private readonly intervalMs: number = 30000 // 30 segundos
  ) {}

  async start(): Promise<void> {
    try {
      // Conectar a RabbitMQ
      this.connection = await amqp.connect(this.rabbitUrl)
      this.channel = await this.connection.createChannel()
        await this.channel.assertExchange('plans.events', 'topic', { durable: true })

      this.logger.info('OutboxWorker iniciado', {
        intervalMs: this.intervalMs
      })

      // Ejecutar procesamiento cada X segundos
      this.intervalId = setInterval(() => {
        this.processOutbox().catch(error => {
          this.logger.error('Error en OutboxWorker', error as Error)
        })
      }, this.intervalMs)
    } catch (error) {
      this.logger.error('Error al iniciar OutboxWorker y conectar con RabbitMQ', error as Error);
      throw error;
    }
  }

  private async processOutbox(): Promise<void> {
    // Buscar eventos pendientes (máximo 3 intentos)
    const pendingEvents = await OutboxModel.find({
      status: 'PENDING',
      attempts: { $lt: 3 }
    }).limit(10) // Procesar máximo 10 por ciclo

    if (pendingEvents.length === 0) return

    this.logger.info('Procesando eventos del Outbox', {
      count: pendingEvents.length
    })

    for (const event of pendingEvents) {
      try {
        // Intentar publicar
        const published = this.channel!.publish(
          'plans.events',
          event.routingKey,
          Buffer.from(JSON.stringify(event.payload)),
          { persistent: true }
        )

        if (published) {
          // Marcar como publicado
          await OutboxModel.findByIdAndUpdate(event._id, {
            status: 'PUBLISHED',
            publishedAt: new Date()
          })

          this.logger.info('Evento del Outbox publicado', {
            routingKey: event.routingKey,
            attempts: event.attempts + 1
          })
        } else {
          throw new Error('Publicación retornó false')
        }
      } catch (error) {
        // Incrementar intentos
        const newAttempts = event.attempts + 1
        const status = newAttempts >= 3 ? 'FAILED' : 'PENDING'

        await OutboxModel.findByIdAndUpdate(event._id, {
          attempts: newAttempts,
          lastAttemptAt: new Date(),
          status,
          error: (error as Error).message
        })

        this.logger.warn('Falló publicación de evento del Outbox', {
          routingKey: event.routingKey,
          attempts: newAttempts,
          error: (error as Error).message
        })
      }
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    (this.channel as any)?.close()
    (this.connection as any)?.close()

    this.logger.info('OutboxWorker detenido')
  }
}
