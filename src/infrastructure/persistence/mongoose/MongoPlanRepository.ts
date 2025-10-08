import { PlanRepositoryPort, FindOptions } from '../../../application/ports/PlanRepositoryPort'
import { Plan } from '../../../domain/entities/Plan'
import { Precio } from '../../../domain/value-objects/Precio'
import { Duracion } from '../../../domain/value-objects/Duracion'
import { FechasDisponibles } from '../../../domain/value-objects/FechasDisponibles'
import { PlanModel } from './models/PlanModel'

export class MongoPlanRepository implements PlanRepositoryPort {
  async save(plan: Plan): Promise<Plan> {
    const planData = plan.toObject()

    // Si tiene ID, es actualización; si no, es creación
    if (planData.id) {
      const updated = await PlanModel.findByIdAndUpdate(
        planData.id,
        {
          ...planData,
          precio: plan.precio.toObject(),
          duracion: plan.duracion.value,
          fechasDisponibles: plan.fechasDisponibles.toArray()
        },
        { new: true, runValidators: true }
      )

      if (!updated) {
        throw new Error(`Plan con id ${planData.id} no encontrado`)
      }

      return this.mapToDomain(updated)
    }

    // Crear nuevo plan
    const newPlan = new PlanModel({
      tenantId: plan.tenantId,
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      precio: plan.precio.toObject(),
      duracion: plan.duracion.value,
      imagenes: plan.imagenes,
      cupoMaximo: plan.cupoMaximo,
      fechasDisponibles: plan.fechasDisponibles.toArray(),
      estado: plan.estado
    })

    const saved = await newPlan.save()
    return this.mapToDomain(saved)
  }

  async findById(id: string, tenantId: string): Promise<Plan | null> {
    const plan = await PlanModel.findOne({ _id: id, tenantId }).lean()

    if (!plan) return null

    return this.mapToDomain(plan)
  }

  async findAll(options: FindOptions): Promise<Plan[]> {
    const query: any = { tenantId: options.tenantId }

    if (options.estado) {
      query.estado = options.estado
    }

    const plans = await PlanModel.find(query)
      .skip(options.skip || 0)
      .limit(options.limit || 20)
      .sort({ createdAt: -1 })
      .lean()

    return plans.map(plan => this.mapToDomain(plan))
  }

  async count(options: Omit<FindOptions, 'skip' | 'limit'>): Promise<number> {
    const query: any = { tenantId: options.tenantId }

    if (options.estado) {
      query.estado = options.estado
    }

    return PlanModel.countDocuments(query)
  }

  async delete(id: string, tenantId: string): Promise<void> {
    // Soft delete: cambiar estado a INACTIVO
    await PlanModel.findOneAndUpdate(
      { _id: id, tenantId },
      { estado: 'INACTIVO' }
    )
  }

  // Mapeo de Mongoose Document a Domain Entity
  private mapToDomain(doc: any): Plan {
    return Plan.create({
      id: doc._id.toString(),
      tenantId: doc.tenantId,
      nombre: doc.nombre,
      descripcion: doc.descripcion,
      precio: new Precio(doc.precio),
      duracion: new Duracion(doc.duracion),
      imagenes: doc.imagenes,
      cupoMaximo: doc.cupoMaximo,
      fechasDisponibles: new FechasDisponibles(doc.fechasDisponibles),
      estado: doc.estado,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    })
  }
}
