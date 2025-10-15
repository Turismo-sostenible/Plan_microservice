// adapters/http/controllers/PlanController.ts

import { Request, Response } from 'express'
import { CreatePlanUseCase } from '../../../application/use-cases/CreatePlanUseCase'
import { CreatePlanDTO } from '../../../application/dtos/CreatePlanDTO'
import { ValidationError } from '../../../domain/errors/ValidationError'
import { ImageFile } from '../../../application/ports/ImageStoragePort'

export class PlanController {
  constructor(private readonly createPlanUseCase: CreatePlanUseCase) {}

  createPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      // Extraer tenantId del token JWT (agregado por middleware)
      const tenantId = req.user?.tenantId

      if (!tenantId) {
        res.status(401).json({
          message: 'Token inválido o sin tenantId'
        })
        return
      }

      // Construir DTO
      const dto: CreatePlanDTO = {
        tenantId,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        precio: {
          valor: parseInt(req.body.precioValor),
          moneda: req.body.precioMoneda || 'COP'
        },
        duracion: parseInt(req.body.duracion),
        cupoMaximo: parseInt(req.body.cupoMaximo),
        fechasDisponibles: JSON.parse(req.body.fechasDisponibles),
        files: this.mapMulterFilesToImageFiles(req.files as Express.Multer.File[])
      }

      // Ejecutar use case
      const result = await this.createPlanUseCase.execute(dto)

      // Respuesta exitosa
      res.status(201).json({
        message: 'Plan creado exitosamente',
        data: result
      })

    } catch (error) {
      this.handleError(error, req, res)
    }
  }

  private mapMulterFilesToImageFiles(files: Express.Multer.File[]): ImageFile[] {
    return files.map(file => ({
      buffer: file.buffer,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    }))
  }

  private handleError(error: any, req: Request, res: Response): void {
    // Log del error
    req.logger?.error('Error en PlanController', error)

    // Errores de validación (400)
    if (error instanceof ValidationError) {
      res.status(400).json({
        message: 'Verifique los datos ingresados',
        errors: [{
          field: error.field,
          message: error.message
        }]
      })
      return
    }

    // Errores de Zod (400)
    if (error.name === 'ZodError') {
      res.status(400).json({
        message: 'Verifique los datos ingresados',
        errors: error.errors.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message
        }))
      })
      return
    }

    // Error genérico del sistema (500)
    res.status(500).json({
      message: 'Se produjo un error en el sistema'
    })
  }
}
