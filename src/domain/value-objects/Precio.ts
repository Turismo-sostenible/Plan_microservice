import { ValidationError } from '../errors/ValidationError'

export interface PrecioProps {
  valor: number
  moneda: 'COP' | 'USD'
}

export class Precio {
  constructor(private readonly props: PrecioProps) {}

  validate(): void {
    // Validar que el valor sea entero positivo
    if (!Number.isInteger(this.props.valor)) {
      throw new ValidationError('precio', 'El precio debe ser un número entero')
    }

    if (this.props.valor <= 0) {
      throw new ValidationError('precio', 'El precio debe ser mayor a 0')
    }

    // Validar moneda
    const monedasPermitidas = ['COP', 'USD']
    if (!monedasPermitidas.includes(this.props.moneda)) {
      throw new ValidationError('precio', `Moneda debe ser una de: ${monedasPermitidas.join(', ')}`)
    }
  }

  get valor(): number { return this.props.valor }
  get moneda(): string { return this.props.moneda }

  // Comparación
  equals(other: Precio): boolean {
    return this.props.valor === other.valor && this.props.moneda === other.moneda
  }

  // "$150,000 COP" format
  format(): string {
    return `$${this.props.valor.toLocaleString()} ${this.props.moneda}`
  }

  toObject(): PrecioProps {
    return { ...this.props }
  }
}
