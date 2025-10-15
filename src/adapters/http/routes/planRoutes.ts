// adapters/http/routes/planRoutes.ts

import { Router } from 'express'
import { PlanController } from '../controllers/PlanController'
import { authMiddleware } from '../middlewares/authMiddleware'
import { requireRole } from '../middlewares/roleMiddleware'
import { uploadMiddleware } from '../middlewares/uploadMiddleware'

export function createPlanRoutes(planController: PlanController): Router {
  const router = Router()

  /**
   * POST /api/v1/plans
   * Crea un nuevo plan turístico
   * Requiere: rol ADMINISTRADOR
   */
  router.post(
    '/plans',
    authMiddleware,              // Valida JWT
    requireRole(['ADMINISTRADOR']), // Valida rol
    uploadMiddleware,            // Procesa multipart/form-data
    planController.createPlan
  )

  // Futuras rutas:
  // router.get('/plans', planController.listPlans)
  // router.get('/plans/:id', planController.getPlan)
  // router.put('/plans/:id', authMiddleware, requireRole(['ADMINISTRADOR']), planController.updatePlan)
  // router.delete('/plans/:id', authMiddleware, requireRole(['ADMINISTRADOR']), planController.deletePlan)

  return router
}
