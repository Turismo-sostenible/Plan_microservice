//src\application\dtos\schemas\updatePlanSchema.ts
import { z } from 'zod'

export const updatePlanSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "id inválido"),
    tenantId: z.uuid("El tenantId debe ser un uuid"), // Solo para validación, no se actualiza
    nombre: z.string()
        .min(10, 'El nombre debe tener mínimo 10 caracteres')
        .max(1000, 'El nombre debe tener máximo 1000 caracteres')
        .refine((value) => value.trim() !== '', 'El nombre no puede estar vacío')
        .optional(),
    descripcion: z.string()
        .min(10, 'La descripción debe tener mínimo 10 caracteres')
        .max(5000, 'La descripción debe tener máximo 5000 caracteres')
        .optional(),
    precio: z.object({
        valor: z.number()
            .int('El precio debe ser un número entero')
            .positive('El precio debe ser mayor a 0'),
        moneda: z.enum(['COP', 'USD'])
    }).optional(),
    duracion: z.number()
        .int('La duración debe ser un número entero de horas')
        .positive('La duración debe ser mayor a 0')
        .optional(),
    cupoMaximo: z.number()
        .int()
        .min(1, 'El cupo mínimo es 1 persona')
        .max(12, 'El cupo máximo es 12 personas')
        .optional(),
    fechasDisponibles: z.array(
        z.object({
            desde: z.iso.datetime('Formato de fecha inválido'),
            hasta: z.iso.datetime('Formato de fecha inválido')
        })
    ).min(1, 'Debe incluir al menos un rango de fechas')
        .optional(),
    estado: z.enum(['ACTIVO', 'INACTIVO']).optional()
}).refine(
    (data) => {
        return data.nombre !== undefined ||
            data.descripcion !== undefined ||
            data.precio !== undefined ||
            data.duracion !== undefined ||
            data.cupoMaximo !== undefined ||
            data.fechasDisponibles !== undefined ||
            data.estado !== undefined
    },
    {
        message: 'Debe proporcionar al menos un campo para actualizar'
    }
)