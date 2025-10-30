// src\application\use-cases\ListPlansUseCase.ts
import { PlanRepositoryPort, FindOptions } from "../ports/PlanRepositoryPort";
import { LoggerPort } from "../ports/LoggerPort";
import { ListPlansDTO } from "../dtos/ListPlansDTO";
import { PlanResponseDTO } from "../dtos/PlanResponseDTO";
import { listPlansSchema } from "../dtos/schemas/listPlansSchema";
import { ValidationError } from "../../domain/errors/ValidationError";
import { Plan } from "../../domain/entities/Plan";

export class ListPlansUseCase {
  constructor(
    private readonly planRepository: PlanRepositoryPort,
    private readonly logger: LoggerPort,
  ) {}
  async execute(
    dto: ListPlansDTO,
  ): Promise<{ plans: PlanResponseDTO[]; total: number }> {
    this.logger.info("Executing ListPlansUseCase");

    //validar con zod
    const validatedData = this.validateDTO(dto);

    // contruir opciones de busqueda
    const findOptions: FindOptions = {
      tenantId: validatedData.tenantId,
      estado: validatedData.estado,
      skip: (validatedData.page - 1) * validatedData.limit,
      limit: validatedData.limit,
    };

    // obtener Planes
    const [plans, total] = await Promise.all([
      this.planRepository.findAll(findOptions),
      this.planRepository.count({
        tenantId: validatedData.tenantId,
        estado: validatedData.estado,
      }),
    ]);

    this.logger.info("Planes listados exitosamente", {
      //count: plans.length,
      total,
    });

    // Mapear a DTO de respuesta
    return {
      plans: plans.map(this.mapToResponseDTO),
      total,
    };
  }
  
  private validateDTO(dto: ListPlansDTO): ListPlansDTO {
    const result = listPlansSchema.safeParse(dto);

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
