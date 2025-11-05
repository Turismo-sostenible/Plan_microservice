// adapters/driving/http/controllers/PlanController.ts

import { NextFunction, Request, Response } from "express";
import { CreatePlanDTO } from "../../../../application/dtos/CreatePlanDTO";
import { ImageFile } from "../../../../application/ports/ImageStoragePort";
import { CreatePlanUseCase } from "../../../../application/use-cases/CreatePlanUseCase";
import { ListPlansUseCase } from "../../../../application/use-cases/ListPlansUseCase";
import { ListPlansDTO } from "../../../../application/dtos/ListPlansDTO";
import { GetPlanByIdUseCase } from "../../../../application/use-cases/GetPlanByIdUseCase";
import { GetPlanByIdDTO } from "../../../../application/dtos/GetPlanbyIdDTO";
import { ValidationError } from "../../../../domain/errors/ValidationError";
import { DeletePlanUseCase } from "../../../../application/use-cases/DeletePlanUseCase";
import { DeletePlanDTO } from "../../../../application/dtos/DeletePlanDTO";
import { UpdatePlanUseCase } from "../../../../application/use-cases/UpdatePlanUseCase";
import { UpdatePlanDTO } from "../../../../application/dtos/UpdatePlanDTO";

export class PlanController {
  constructor(
    private readonly createPlanUseCase: CreatePlanUseCase,
    private readonly listPlansUseCase: ListPlansUseCase,
    private readonly getPlanByIdUseCase: GetPlanByIdUseCase,
    private readonly deletePlanUseCase: DeletePlanUseCase,
    private readonly updatePlanUseCase: UpdatePlanUseCase,
  ) {}

  createPlan = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tenantId = req.headers["tenant_id"] as string;
      if (!tenantId) {
        res.status(400).json({ message: "El header tenant_id es requerido" });
        return;
      }

      const dto = JSON.parse(req.body.dto);

      const bodyDto: CreatePlanDTO = {
        tenantId: tenantId,
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
      const result = await this.createPlanUseCase.execute(bodyDto);

      res.status(201).json({
        message: "Plan creado exitosamente",
        data: result,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
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
      size: file.size,
    }));
  }

  listPlans = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tenantId = req.headers["tenant_id"] as string;
      if (!tenantId) {
        res.status(400).json({ message: "El header tenant_id es requerido" });
        return;
      }

      const dto: ListPlansDTO = {
        tenantId: tenantId,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        estado: req.query.estado as any,
      };

      const result = await this.listPlansUseCase.execute(dto);

      if (result.plans.length === 0) {
        res.status(404).json({ message: "No se encontraron planes" });
        return;
      }

      res.status(200).json({
        message: "Planes listados exitosamente",
        data: result.plans,
        meta: {
          total: result.total,
          page: dto.page,
          limit: dto.limit,
        },
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      next(error);
    }
  };

  getPlanById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tenantId = req.headers["tenant_id"] as string;
      if (!tenantId) {
        res.status(400).json({ message: "El header tenant_id es requerido" });
        return;
      }

      const dto: GetPlanByIdDTO = {
        tenantId: tenantId,
        id: req.params.id as string,
      };

      const result = await this.getPlanByIdUseCase.execute(dto);

      res.status(200).json({
        message: "Plan obtenido exitosamente",
        data: result,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error instanceof Error && error.message === "Plan no encontrado") {
        res.status(404).json({ message: error.message });
        return;
      }
      next(error);
    }
  };

  deletePlan = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tenantId = req.headers["tenant_id"] as string;
      if (!tenantId) {
        res.status(400).json({ message: "El header tenant_id es requerido" });
        return;
      }

      const dto: DeletePlanDTO = {
        tenantId: tenantId,
        id: req.params.id as string,
      };

      const result = await this.deletePlanUseCase.execute(dto);

      res.status(200).json({
        message: "Plan eliminado exitosamente",
        data: result,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error instanceof Error && error.message === "Plan no encontrado") {
        res.status(404).json({ message: error.message });
        return;
      }
      next(error);
    }
  };
  updatePlan = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tenantId = req.headers["tenant_id"] as string;
      if (!tenantId) {
        res.status(400).json({ message: "El header tenant_id es requerido" });
        return;
      }

      const dto: UpdatePlanDTO = {
        tenantId: tenantId,
        id: req.params.id as string,
        nombre: req.body?.nombre,
        descripcion: req.body?.descripcion,
        precio: req.body?.precio,
        duracion: req.body?.duracion,
        cupoMaximo: req.body?.cupoMaximo,
        fechasDisponibles: req.body?.fechasDisponibles,
        estado: req.body?.estado,
      };

      const result = await this.updatePlanUseCase.execute(dto);

      res.status(200).json({
        message: "Plan actualizado exitosamente",
        data: result,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error instanceof Error && error.message === "Plan no encontrado") {
        res.status(404).json({ message: error.message });
        return;
      }
      next(error);
    }
  };
}