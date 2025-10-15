// application/dtos/PlanResponseDTO.ts

export interface PlanResponseDTO {
  id: string
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
  estado: string
  createdAt: Date
  updatedAt: Date
}