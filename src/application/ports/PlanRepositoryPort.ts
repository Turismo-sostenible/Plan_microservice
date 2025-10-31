// application/ports/PlanRepositoryPort.ts

import { Plan } from '../../domain/entities/Plan'

export interface FindOptions {
  tenantId: string
  estado?: 'ACTIVO' | 'INACTIVO'
  skip?: number
  limit?: number
}

export interface PlanRepositoryPort {
  /**
   * Guarda un plan (insert o update según exista id)
   * @throws RepositoryError si falla la persistencia
   */
  save(plan: Plan): Promise<Plan>

  /**
   * Busca un plan por ID
   * @returns Plan o null si no existe
   */
  findById(id: string, tenantId: string): Promise<Plan | null>

  /**
   * Lista planes con filtros
   */
  findAll(options: FindOptions): Promise<Plan[]>

  /**
   * Cuenta total de planes (para paginación)
   */
  count(options: Omit<FindOptions, 'skip' | 'limit'>): Promise<number>

  /**
   * Elimina un plan
   */
  delete(id: string, tenantId: string): Promise<void>
}
