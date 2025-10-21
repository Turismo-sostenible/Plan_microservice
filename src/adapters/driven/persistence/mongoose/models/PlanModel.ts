import mongoose, { Schema, Document } from 'mongoose'

export interface IPlanDocument extends Document {
  tenantId: string
  nombre: string
  descripcion: string
  precio: {
    valor: number
    moneda: string
  }
  duracion: number
  imagenes: string[]
  cupoMaximo: number
  fechasDisponibles: Array<{
    desde: Date
    hasta: Date
  }>
  estado: 'ACTIVO' | 'INACTIVO'
  createdAt: Date
  updatedAt: Date
}

const PlanSchema = new Schema<IPlanDocument>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true // Índice para multitenencia
    },
    nombre: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 1000
    },
    descripcion: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 5000
    },
    precio: {
      valor: { type: Number, required: true },
      moneda: { type: String, required: true, enum: ['COP', 'USD'] }
    },
    duracion: {
      type: Number,
      required: true
    },
    imagenes: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length >= 1 && v.length <= 3,
        message: 'Debe haber entre 1 y 3 imágenes'
      }
    },
    cupoMaximo: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    fechasDisponibles: [
      {
        desde: { type: Date, required: true },
        hasta: { type: Date, required: true }
      }
    ],
    estado: {
      type: String,
      enum: ['ACTIVO', 'INACTIVO'],
      default: 'ACTIVO'
    }
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    collection: 'planes'
  }
)

// Índice compuesto para búsquedas eficientes
PlanSchema.index({ tenantId: 1, estado: 1 })

// Índice de texto para búsqueda full-text
PlanSchema.index({ nombre: 'text', descripcion: 'text' })

export const PlanModel = mongoose.model<IPlanDocument>('Plan', PlanSchema)