//src\application\dtos\schemas\getPlanByIdSchema.ts
import { z } from "zod";

export const getPlanByIdSchema = z.object({
    id: z.string("id debe ser un id valido").min(1),
    tenantId: z.uuid("tenantId debe ser un UUID valido")
});
