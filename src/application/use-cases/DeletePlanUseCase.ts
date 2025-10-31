import { DeletePlanDTO } from "../dtos/DeletePlanDTO";
import { LoggerPort } from "../ports/LoggerPort";
import { PlanRepositoryPort } from "../ports/PlanRepositoryPort";
import { deletePlanSchema } from "../dtos/schemas/deletePlanSchema";
import { ValidationError } from "../../domain/errors/ValidationError";

export class DeletePlanUseCase {
    constructor(
        private readonly planRepository: PlanRepositoryPort,
        private readonly logger: LoggerPort,
    ) { }

    async execute(dto: DeletePlanDTO): Promise<void | { id: string }> {
        this.logger.info("Executing DeletePlanUseCase");
        //validar con zod
        const validatedData = this.validateDTO(dto);
        //verificar existencia
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

        //eliminar
        await this.planRepository.delete(
            validatedData.id,
            validatedData.tenantId
        );

        this.logger.info("Plan eliminado exitosamente");
        return { id: validatedData.id };
    }

    private validateDTO(dto: DeletePlanDTO): DeletePlanDTO {
        const result = deletePlanSchema.safeParse(dto);
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
}