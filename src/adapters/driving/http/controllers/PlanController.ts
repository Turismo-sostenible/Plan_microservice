// adapters/http/controllers/PlanController.ts

import { Request, Response, NextFunction } from 'express'
import { CreatePlanUseCase } from '../../../application/use-cases/CreatePlanUseCase'
import { CreatePlanDTO } from '../../../application/dtos/CreatePlanDTO'
import { ImageFile } from '../../../application/ports/ImageStoragePort'

export class PlanController {
  constructor(private readonly createPlanUseCase: CreatePlanUseCase) {}

  createPlan = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // const tenantId = req.user?.tenantId; // Uncomment when auth is ready
      // if (!tenantId) {
      //   res.status(401).json({ message: 'Token inválido o sin tenantId' });
      //   return;
      // }

      const dto = JSON.parse(req.body.dto);

      const bodyDto: CreatePlanDTO = {
        tenantId: dto.tenantId,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        precio: {
          valor: dto.precio.valor,
          moneda: dto.precio.moneda || "COP",
        },
        duracion: dto.duracion,
        cupoMaximo: dto.cupoMaximo,
        fechasDisponibles: dto.fechasDisponibles,
        files: this.mapMulterFilesToImageFiles(
          req.files as Express.Multer.File[],
        ),
      };

      // Ejecutar use case
      const result = await this.createPlanUseCase.execute(bodyDto)

      res.status(201).json({
        message: 'Plan creado exitosamente',
        data: result
      })

    } catch (error) {
      next(error);
    }
  };

  private mapMulterFilesToImageFiles(
    files: Express.Multer.File[],
  ): ImageFile[] {
    if (!files || files.length === 0) {
      return [];
    }
    return files.map((file) => ({
      buffer: file.buffer,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    }))
  }
}
