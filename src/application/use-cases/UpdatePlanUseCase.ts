import { LoggerPort } from "../ports/LoggerPort";
import { PlanRepositoryPort } from "../ports/PlanRepositoryPort";
import { UpdatePlanDTO } from "../dtos/UpdatePlanDTO";
import { updatePlanSchema } from "../dtos/schemas/updatePlanSchema";
import { ValidationError } from "../../domain/errors/ValidationError";
import { Plan } from "../../domain/entities/Plan";
import { Duracion } from "../../domain/value-objects/Duracion";
import { FechasDisponibles } from "../../domain/value-objects/FechasDisponibles";
import { Precio } from "../../domain/value-objects/Precio";
import { PlanResponseDTO } from "../dtos/PlanResponseDTO";

export class UpdatePlanUseCase {
    constructor(
        private readonly planRepository: PlanRepositoryPort,
        private readonly logger: LoggerPort,
    ) { }

    async execute(dto: UpdatePlanDTO): Promise<PlanResponseDTO> {
        this.logger.info("Executing UpdatePlanUseCase");
        /** envolver todo en try catch dos veces si se requiere actualizar imágenes */
        try {
            //validar con zod
            const validatedData = this.validateDTO(dto);

            //verificar existencia
            const existing = await this.planRepository.findById(
                validatedData.id,
                validatedData.tenantId
            );

            if (!existing) {
                this.logger.warn("Plan no encontrado", {
                    id: validatedData.id,
                    tenantId: validatedData.tenantId,
                });
                throw new Error("Plan no encontrado");
            }

            //actualizar (merge con existentes)
            const updatedPlan = this.buildUpdatedPlan(existing, validatedData);

            //persistir y obtener entidad final (con timestamps actualizados)
            const saved = await this.planRepository.save(updatedPlan);

            this.logger.info('Plan actualizado exitosamente', { id: saved.id })

            //retornar DTO de respuesta
            return this.mapToResponseDTO(saved);

        } catch (error) {
            this.logger.error("Error en UpdatePlanUseCase", error as Error, {
                tenantId: dto.tenantId
            })
            throw error
        }
    }

    private buildUpdatedPlan(existingPlan: Plan, dto: UpdatePlanDTO): Plan {
        // Campos primitivos opcionales
        const nombre = dto.nombre ?? existingPlan.nombre;
        const descripcion = dto.descripcion ?? existingPlan.descripcion;
        const estado = dto.estado ?? existingPlan.estado;
        const cupoMaximo = dto.cupoMaximo ?? existingPlan.cupoMaximo;

        // Precio (Value Object): si viene en DTO, construir VO; si no, reutilizar existente
        const precio = dto.precio
            ? new Precio({
                valor: dto.precio.valor,
                moneda: dto.precio.moneda,
            })
            : existingPlan.precio;

        // Duración (Value Object)
        const duracion = dto.duracion !== undefined
            ? new Duracion(dto.duracion)
            : existingPlan.duracion;

        // FechasDisponibles (Value Object)
        const fechasDisponibles = dto.fechasDisponibles !== undefined
            ? new FechasDisponibles(
                dto.fechasDisponibles.map((rango) => ({
                    desde: new Date(rango.desde),
                    hasta: new Date(rango.hasta),
                })),
            )
            : existingPlan.fechasDisponibles;

        // Imágenes: no se actualizan por ahora
        const imagenes = existingPlan.imagenes;

        // Construir entidad Plan con merge
        return Plan.create({
            id: existingPlan.id!,
            tenantId: existingPlan.tenantId,
            nombre,
            descripcion,
            precio,
            duracion,
            imagenes,
            cupoMaximo,
            fechasDisponibles,
            estado,
        });
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
            updatedAt: plan.toObject().updatedAt!,
        };
    }

    private validateDTO(dto: UpdatePlanDTO): UpdatePlanDTO {
        const result = updatePlanSchema.safeParse(dto);

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
        return result.data as UpdatePlanDTO;
    }
}