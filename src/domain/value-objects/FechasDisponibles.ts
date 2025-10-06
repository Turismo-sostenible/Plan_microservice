import { ValidationError } from '../errors/ValidationError'

export interface RangoFecha {
  desde: Date
  hasta: Date
}

export class FechasDisponibles {
  constructor(private readonly rangos: RangoFecha[]) {}

  validate(): void {
    // 1. Validar que haya al menos un rango
    if (this.rangos.length === 0) {
      throw new ValidationError('fechasDisponibles', 'Debe incluir al menos un rango de fechas')
    }

    const ahora = new Date()

    // 2. Validar cada rango individualmente
    for (const rango of this.rangos) {
      // desde < hasta
      if (rango.desde >= rango.hasta) {
        throw new ValidationError(
          'fechasDisponibles',
          `Fecha "desde" (${rango.desde}) debe ser anterior a "hasta" (${rango.hasta})`
        )
      }

      // No permitir fechas pasadas
      if (rango.desde < ahora) {
        throw new ValidationError(
          'fechasDisponibles',
          'No se permiten fechas pasadas'
        )
      }
    }

    // 3. Validar que NO haya solapamiento entre rangos
    this.validateNoOverlap()
  }

  private validateNoOverlap(): void {
    for (let i = 0; i < this.rangos.length; i++) {
      for (let j = i + 1; j < this.rangos.length; j++) {
        const rango1 = this.rangos[i]
        const rango2 = this.rangos[j]
        
        // Hay solapamiento si: (desde1 <= hasta2) AND (hasta1 >= desde2)
        const haySolapamiento =
          rango1.desde <= rango2.hasta && rango1.hasta >= rango2.desde

        if (haySolapamiento) {
          throw new ValidationError(
            'fechasDisponibles',
            `Solapamiento detectado entre rangos: ` +
            `[${rango1.desde.toISOString()} - ${rango1.hasta.toISOString()}] y ` +
            `[${rango2.desde.toISOString()} - ${rango2.hasta.toISOString()}]`
          )
        }
      }
    }
  }

  get values(): RangoFecha[] {
    return this.rangos.map(r => ({ ...r })) // Copia defensiva
  }

  toArray(): RangoFecha[] {
    return this.values
  }
}
