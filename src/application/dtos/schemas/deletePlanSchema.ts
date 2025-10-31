//src\application\dtos\schemas\deletePlanSchema.ts
import { z } from "zod";

export const deletePlanSchema = z.object({
    id: z.string("id debe ser un id valido").min(1),
    tenantId: z.uuid("tenantId debe ser un UUID valido")
});
