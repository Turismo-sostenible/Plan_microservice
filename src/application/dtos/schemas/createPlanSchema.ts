// application/dtos/schemas/createPlanSchema.ts

import { z } from 'zod'

export const createPlanSchema = z.object({
  tenantId: z.uuid('tenantId debe ser un UUID válido'),

  nombre: z.string()
    .min(10, 'El nombre debe tener mínimo 10 caracteres')
    .max(1000, 'El nombre debe tener máximo 1000 caracteres'),

  descripcion: z.string()
    .min(10, 'La descripción debe tener mínimo 10 caracteres')
    .max(5000, 'La descripción debe tener máximo 5000 caracteres'),

  precio: z.object({
    valor: z.number()
      .int('El precio debe ser un número entero')
      .positive('El precio debe ser mayor a 0'),
    moneda: z.enum(['COP', 'USD', 'EUR'])
  }),

  duracion: z.number()
    .int('La duración debe ser un número entero de horas')
    .positive('La duración debe ser mayor a 0'),

  cupoMaximo: z.number()
    .int()
    .min(1, 'El cupo mínimo es 1 persona')
    .max(12, 'El cupo máximo es 12 personas'),

  fechasDisponibles: z.array(
    z.object({
      desde: z.iso.datetime('Formato de fecha inválido'),
      hasta: z.iso.datetime('Formato de fecha inválido')
    })
  ).min(1, 'Debe incluir al menos un rango de fechas'),

  files: z.array(z.any())
    .min(1, 'Debe incluir al menos 1 imagen')
    .max(3, 'Máximo 3 imágenes permitidas')
})
