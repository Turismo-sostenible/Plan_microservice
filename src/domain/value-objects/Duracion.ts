import { ValidationError } from '../errors/ValidationError'

export class Duracion {
  constructor(private readonly horas: number) {}

  validate(): void {
    if (!Number.isInteger(this.horas)) {
      throw new ValidationError('duracion', 'La duración debe ser un número entero de horas')
    }

    if (this.horas <= 0) {
      throw new ValidationError('duracion', 'La duración debe ser mayor a 0 horas')
    }

    // TODO: Agregar validación de rango (mínimo/máximo) cuando se defina
  }

  get value(): number {
    return this.horas
  }

  // Método para convertir a días
  toDias(): number {
    return Math.floor(this.horas / 24)
  }

  // Método para formatear la duración
  format(): string {
    const dias = this.toDias()
    const horasRestantes = this.horas % 24

    if (dias === 0) {
      return `${this.horas} hora${this.horas > 1 ? 's' : ''}`
    }

    if (horasRestantes === 0) {
      return `${dias} día${dias > 1 ? 's' : ''}`
    }

    return `${dias} día${dias > 1 ? 's' : ''} y ${horasRestantes} hora${horasRestantes > 1 ? 's' : ''}`
  }
}
