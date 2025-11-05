import { ValidationError } from "../../domain/errors/ValidationError";
import { GetPlanByIdDTO } from "../dtos/GetPlanbyIdDTO";
import { PlanResponseDTO } from "../dtos/PlanResponseDTO";
import { getPlanByIdSchema } from "../dtos/schemas/getPlanByIdSchema";
import { LoggerPort } from "../ports/LoggerPort";
import { PlanRepositoryPort } from "../ports/PlanRepositoryPort";
import { Plan } from "../../domain/entities/Plan";

export class GetPlanByIdUseCase {
    constructor(
        private readonly planRepository: PlanRepositoryPort,
        private readonly logger: LoggerPort,
    ) { }
    async execute(dto: GetPlanByIdDTO): Promise<PlanResponseDTO> {
        this.logger.info("Executing GetPlanByIdUseCase");

        //validar con zod
        const validatedData = this.validateDTO(dto);

        // buscar plan
        const plan = await this.planRepository.findById(
            validatedData.id,
            validatedData.tenantId
        );

        if (!plan) {
            this.logger.warn("Plan no encontrado", {
                id: validatedData.id,
                tenantId: validatedData.tenantId,
            });
            throw new Error("Plan no encontrado");
        }

        this.logger.info("Plan encontrado exitosamente");

        // mapear a dto de respuesta
        return this.mapToResponseDTO(plan);
    }

    private validateDTO(dto: GetPlanByIdDTO): GetPlanByIdDTO {
        const result = getPlanByIdSchema.safeParse(dto);

        if (!result.success) {
            const errors = result.error.issues.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));

            this.logger.warn("Validacion de DTO fallo", { errors });

            throw new ValidationError(
                "dto",
                `Datos inválidos: ${JSON.stringify(errors)}`,
            );
        }
        return result.data;
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
}