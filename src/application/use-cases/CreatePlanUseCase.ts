// application/use-cases/CreatePlanUseCase.ts

import { Plan } from '../../domain/entities/Plan'
import { Precio } from '../../domain/value-objects/Precio'
import { Duracion } from '../../domain/value-objects/Duracion'
import { FechasDisponibles } from '../../domain/value-objects/FechasDisponibles'
import { PlanCreated } from '../../domain/events/PlanCreated'
import { ValidationError } from '../../domain/errors/ValidationError'

import { PlanRepositoryPort } from '../ports/PlanRepositoryPort'
import { ImageStoragePort } from '../ports/ImageStoragePort'
import { MessageBusPort } from '../ports/MessageBusPort'
import { LoggerPort } from '../ports/LoggerPort'

import { CreatePlanDTO } from '../dtos/CreatePlanDTO'
import { PlanResponseDTO } from '../dtos/PlanResponseDTO'
import { createPlanSchema } from '../dtos/schemas/createPlanSchema'

export class CreatePlanUseCase {
  constructor(
    private readonly planRepository: PlanRepositoryPort,
    private readonly imageStorage: ImageStoragePort,
    private readonly messageBus: MessageBusPort,
    private readonly logger: LoggerPort
  ) {}

  async execute(dto: CreatePlanDTO): Promise<PlanResponseDTO> {
    this.logger.info('Iniciando creación de plan', {
      tenantId: dto.tenantId,
      nombre: dto.nombre
    })

    try {
      // PASO 1: Validar DTO con Zod
      const validatedData = this.validateDTO(dto)

      // PASO 2: Validar archivos de imágenes
      this.imageStorage.validateFiles(dto.files)

      // PASO 3: Guardar imágenes (retorna URLs)
      const imageUrls = await this.saveImages(dto)

      try {
        // PASO 4: Crear entidad de dominio
        const plan = this.createPlanEntity(validatedData, imageUrls)

        // PASO 5: Persistir en base de datos
        const savedPlan = await this.planRepository.save(plan)

        // PASO 6: Publicar evento (patrón Outbox)
        await this.publishEvent(savedPlan)

        this.logger.info('Plan creado exitosamente', {
          planId: savedPlan.id,
          tenantId: savedPlan.tenantId
        })

        // PASO 7: Retornar DTO de respuesta
        return this.mapToResponseDTO(savedPlan)

      } catch (error) {
        // ROLLBACK: Si falla DB o evento, eliminar imágenes
        this.logger.warn('Error al persistir plan, ejecutando rollback de imágenes', {
          error: (error as Error).message
        })

        await this.imageStorage.deleteImages(imageUrls)
          .catch(rollbackError => {
            this.logger.error('Falló rollback de imágenes', rollbackError as Error, {
              imageUrls
            })
          })

        throw error
      }

    } catch (error) {
      this.logger.error('Error en CreatePlanUseCase', error as Error, {
        tenantId: dto.tenantId
      })
      throw error
    }
  }

  private validateDTO(dto: CreatePlanDTO): CreatePlanDTO {
    const result = createPlanSchema.safeParse(dto)

    if (!result.success) {
      const errors = result.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))

      this.logger.warn('Validación de DTO falló', { errors })

      throw new ValidationError(
        'dto',
        `Datos inválidos: ${JSON.stringify(errors)}`
      )
    }

    return result.data as CreatePlanDTO;
  }

  private async saveImages(dto: CreatePlanDTO): Promise<string[]> {
    // Generar planId temporal (se reemplazará con el real después)
    const tempPlanId = `temp-${Date.now()}`

    const imageUrls = await this.imageStorage.saveImages(dto.files, {
      tenantId: dto.tenantId,
      planId: tempPlanId,
      compress: true,
      maxWidth: 1920,
      quality: 80
    })

    this.logger.debug('Imágenes guardadas', {
      count: imageUrls.length,
      urls: imageUrls
    })

    return imageUrls
  }

  private createPlanEntity(
    dto: CreatePlanDTO,
    imageUrls: string[]
  ): Plan {
    // Crear Value Objects
    const precio = new Precio({
      valor: dto.precio.valor,
      moneda: dto.precio.moneda
    })

    const duracion = new Duracion(dto.duracion)

    const fechasDisponibles = new FechasDisponibles(
      dto.fechasDisponibles.map(rango => ({
        desde: new Date(rango.desde),
        hasta: new Date(rango.hasta)
      }))
    )

    // Crear entidad Plan (ejecuta validaciones)
    return Plan.create({
      tenantId: dto.tenantId,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      precio,
      duracion,
      imagenes: imageUrls,
      cupoMaximo: dto.cupoMaximo,
      fechasDisponibles,
      estado: 'ACTIVO'
    })
  }

  private async publishEvent(plan: Plan): Promise<void> {
    const event = new PlanCreated({
      planId: plan.id!,
      tenantId: plan.tenantId,
      nombre: plan.nombre,
      precio: plan.precio.toObject(),
      fechasDisponibles: plan.fechasDisponibles.toArray(),
      cupoMaximo: plan.cupoMaximo,
      timestamp: new Date()
    })

    // El MessageBusPort implementa patrón Outbox internamente
    await this.messageBus.publish('plan.created', event.toJSON())

    this.logger.info('Evento plan.created publicado', {
      planId: plan.id
    })
  }

  private mapToResponseDTO(plan: Plan): PlanResponseDTO {
    return {
      id: plan.id!,
      tenantId: plan.tenantId,
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      precio: plan.precio.toObject(),
      duracion: plan.duracion.value,
      imagenes: plan.imagenes,
      cupoMaximo: plan.cupoMaximo,
      fechasDisponibles: plan.fechasDisponibles.toArray(),
      estado: plan.estado,
      createdAt: plan.toObject().createdAt!,
      updatedAt: plan.toObject().updatedAt!
    }
  }
}
