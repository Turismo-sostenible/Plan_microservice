// application/dtos/CreatePlanDTO.ts

import { ImageFile } from '../ports/ImageStoragePort'

export interface CreatePlanDTO {
  tenantId: string
  nombre: string
  descripcion: string
  precio: {
    valor: number
    moneda: 'COP' | 'USD'
  }
  duracion: number // horas
  cupoMaximo: number
  fechasDisponibles: Array<{
    desde: string // ISO string
    hasta: string
  }>
  files: ImageFile[] // Archivos de imágenes
}
