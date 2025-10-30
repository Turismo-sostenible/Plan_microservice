// src\application\dtos\schemas\listPlansSchema.ts
import { z } from "zod";

export const listPlansSchema = z.object({
  tenantId: z.uuid("tenantId debe ser un UUID valido"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  estado: z.enum(["ACTIVO", "INACTIVO"]).optional(),
});
