import mongoose, { Schema } from 'mongoose'

export interface IOutboxDocument {
  routingKey: string
  payload: any
  status: 'PENDING' | 'PUBLISHED' | 'FAILED'
  attempts: number
  lastAttemptAt?: Date
  publishedAt?: Date
  error?: string
  createdAt: Date
}

const OutboxSchema = new Schema<IOutboxDocument>({
  routingKey: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'PUBLISHED', 'FAILED'],
    default: 'PENDING'
  },
  attempts: { type: Number, default: 0 },
  lastAttemptAt: Date,
  publishedAt: Date,
  error: String,
  createdAt: { type: Date, default: Date.now }
})

// Índice para encontrar eventos pendientes eficientemente
OutboxSchema.index({ status: 1, createdAt: 1 })

export const OutboxModel = mongoose.model<IOutboxDocument>('Outbox', OutboxSchema)