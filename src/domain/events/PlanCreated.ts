// domain/events/PlanCreated.ts

export interface PlanCreatedPayload {
  planId: string
  tenantId: string
  nombre: string
  precio: {
    valor: number
    moneda: string
  }
  fechasDisponibles: Array<{
    desde: Date
    hasta: Date
  }>
  cupoMaximo: number
  timestamp: Date
}

export class PlanCreated {
  public readonly eventName = 'plan.created'
  public readonly occurredAt: Date

  constructor(public readonly payload: PlanCreatedPayload) {
    this.occurredAt = new Date()
  }

  // Serialización para RabbitMQ
  toJSON() {
    return {
      event: this.eventName,
      data: {
        ...this.payload,
        timestamp: this.occurredAt.toISOString()
      }
    }
  }
}
