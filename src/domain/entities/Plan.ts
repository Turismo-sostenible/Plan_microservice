import { Precio } from '../value-objects/Precio'
import { Duracion } from '../value-objects/Duracion'
import { FechasDisponibles } from '../value-objects/FechasDisponibles'
import { ValidationError } from '../errors/ValidationError'

export interface PlanProps {
  id?: string // Opcional en creación
  tenantId: string
  nombre: string
  descripcion: string
  precio: Precio
  duracion: Duracion
  imagenes: string[] // URLs
  cupoMaximo: number
  fechasDisponibles: FechasDisponibles
  estado: 'ACTIVO' | 'INACTIVO'
  createdAt?: Date
  updatedAt?: Date
}

export class Plan {
  private constructor(private props: PlanProps) {
    this.validate()
  }

  // Factory method (patrón creacional)
  static create(props: PlanProps): Plan {
    return new Plan({
      ...props,
      id: props.id || undefined, // Se generará en persistencia
      estado: props.estado || 'ACTIVO',
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    })
  }

  // Validaciones de negocio (invariantes)
  private validate(): void {
    // Validar nombre
    if (this.props.nombre.length < 10 || this.props.nombre.length > 1000) {
      throw new ValidationError(
        'nombre',
        'El nombre debe tener entre 10 y 1000 caracteres'
      )
    }

    // Validar descripción
    if (this.props.descripcion.length < 10 || this.props.descripcion.length > 5000) {
      throw new ValidationError(
        'descripcion',
        'La descripción debe tener entre 10 y 5000 caracteres'
      )
    }

    // Validar cupo
    if (this.props.cupoMaximo < 1 || this.props.cupoMaximo > 12) {
      throw new ValidationError(
        'cupoMaximo',
        'El cupo debe estar entre 1 y 12 personas'
      )
    }

    // Validar imágenes
    if (this.props.imagenes.length < 1 || this.props.imagenes.length > 3) {
      throw new ValidationError(
        'imagenes',
        'Debe incluir entre 1 y 3 imágenes'
      )
    }

    // Validaciones delegadas a Value Objects
    this.props.precio.validate()
    this.props.duracion.validate()
    this.props.fechasDisponibles.validate()
  }

  // Getters (exponer propiedades de forma controlada)
  get id(): string | undefined { return this.props.id }
  get tenantId(): string { return this.props.tenantId }
  get nombre(): string { return this.props.nombre }
  get descripcion(): string { return this.props.descripcion }
  get precio(): Precio { return this.props.precio }
  get duracion(): Duracion { return this.props.duracion }
  get imagenes(): string[] { return [...this.props.imagenes] } // Copia defensiva
  get cupoMaximo(): number { return this.props.cupoMaximo }
  get fechasDisponibles(): FechasDisponibles { return this.props.fechasDisponibles }
  get estado(): 'ACTIVO' | 'INACTIVO' | 'BORRADOR' { return this.props.estado }

  // Métodos de negocio
  activar(): void {
    if (this.props.estado === 'ACTIVO') {
      throw new ValidationError('estado', 'El plan ya está activo')
    }
    this.props.estado = 'ACTIVO'
    this.props.updatedAt = new Date()
  }

  desactivar(): void {
    if (this.props.estado === 'INACTIVO') {
      throw new ValidationError('estado', 'El plan ya está inactivo')
    }
    this.props.estado = 'INACTIVO'
    this.props.updatedAt = new Date()
  }

  // Serialización para persistencia
  toObject(): PlanProps {
    return { ...this.props }
  }
}