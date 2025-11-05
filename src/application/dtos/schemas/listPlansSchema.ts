// src\application\dtos\schemas\listPlansSchema.ts
import { z } from "zod";

export const listPlansSchema = z.object({
  tenantId: z
    .string("El tenantId es requerido.")
    .min(1, "El tenantId no puede estar vacío."),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  estado: z.enum(["ACTIVO", "INACTIVO"]).optional(),
});
