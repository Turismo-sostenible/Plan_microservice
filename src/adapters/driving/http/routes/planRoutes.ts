// adapters/http/routes/planRoutes.ts

/**
 * @swagger
 * components:
 *   schemas:
 *     PlanResponseDTO:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID del plan generado por la base de datos.
 *           example: "60d0fe4f5311236168a109ca"
 *         tenantId:
 *           type: string
 *           description: ID del tenant al que pertenece el plan.
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         nombre:
 *           type: string
 *           example: "Aventura en la Montaña Mágica"
 *         descripcion:
 *           type: string
 *           example: "Una experiencia inolvidable de 3 días..."
 *         precio:
 *           type: object
 *           properties:
 *             valor:
 *               type: number
 *               example: 250000
 *             moneda:
 *               type: string
 *               example: "COP"
 *         duracion:
 *           type: number
 *           description: Duración en horas.
 *           example: 48
 *         imagenes:
 *           type: array
 *           items:
 *             type: string
 *             format: url
 *           example: ["/uploads/planes/tenant-123/plan-abc/imagen1.jpg"]
 *         cupoMaximo:
 *           type: number
 *           example: 10
 *         fechasDisponibles:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               desde:
 *                 type: string
 *                 format: date-time
 *               hasta:
 *                 type: string
 *                 format: date-time
 *         estado:
 *           type: string
 *           example: "ACTIVO"
 *         createdAt:
 *           type: string
 *           format: date-time
 */
import { Router } from "express";
import { PlanController } from "../controllers/PlanController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireRole } from "../middlewares/roleMiddleware";
import { uploadMiddleware } from "../middlewares/uploadMiddleware";

export function createPlanRoutes(planController: PlanController): Router {
  const router = Router();

  /**
   * @swagger
   * /plans:
   *   post:
   *     summary: Crea un nuevo plan turístico
   *     description: Este endpoint permite a un administrador crear un nuevo plan turístico, incluyendo detalles, precios, fechas y hasta 3 imágenes.
   *     tags: [Planes]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - nombre
   *               - descripcion
   *               - precioValor
   *               - duracion
   *               - cupoMaximo
   *               - fechasDisponibles
   *               - files
   *             properties:
   *               nombre:
   *                 type: string
   *                 description: Nombre del plan turístico (10-1000 caracteres).
   *                 example: "Aventura en la Montaña Mágica"
   *               descripcion:
   *                 type: string
   *                 description: Descripción detallada del plan (10-5000 caracteres).
   *                 example: "Una experiencia inolvidable de 3 días..."
   *               precioValor:
   *                 type: integer
   *                 description: Valor del precio en la moneda especificada (entero > 0).
   *                 example: 250000
   *               precioMoneda:
   *                 type: string
   *                 description: Moneda del precio (COP, USD, EUR).
   *                 example: "COP"
   *               duracion:
   *                 type: integer
   *                 description: Duración del plan en horas (entero > 0).
   *                 example: 48
   *               cupoMaximo:
   *                 type: integer
   *                 description: Número máximo de personas para el plan (1-12).
   *                 example: 10
   *               fechasDisponibles:
   *                 type: string
   *                 description: Un array de objetos JSON con rangos de fechas disponibles.
   *                 example: '[{"desde": "2025-12-01T00:00:00.000Z", "hasta": "2025-12-15T23:59:59.000Z"}]'
   *               files:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *                 description: De 1 a 3 imágenes para el plan (JPG/PNG, max 100MB c/u).
   *     responses:
   *       '201':
   *         description: Plan creado exitosamente.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Plan creado exitosamente"
   *                 data:
   *                   $ref: '#/components/schemas/PlanResponseDTO'
   *       '400':
   *         description: Datos de entrada inválidos.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Verifique los datos ingresados"
   *                 errors:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       field:
   *                         type: string
   *                       message:
   *                         type: string
   *       '401':
   *         description: No autorizado. Token JWT no proporcionado o inválido.
   *       '500':
   *         description: Error interno del servidor.
   */
  router.post(
    "/plans",
    //authMiddleware,              // Valida JWT
    //requireRole(['ADMINISTRADOR']), // Valida rol
    uploadMiddleware, // Procesa multipart/form-data
    planController.createPlan,
  );
  /**
   * @swagger
   * /plans:
   *   get:
   *     summary: Lista planes turísticos
   *     description: Retorna una lista paginada de planes filtrados por tenant y estado.
   *     tags: [Planes]
   *     parameters:
   *       - in: query
   *         name: tenantId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Identificador del tenant
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *       - in: query
   *         name: estado
   *         schema:
   *           type: string
   *           enum: [ACTIVO, INACTIVO]
   *     responses:
   *       '200':
   *         description: Planes listados exitosamente.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/PlanResponseDTO'
   *                 meta:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *       '400':
   *         description: Parámetros inválidos.
   *       '404':
   *         description: No se encontraron planes.
   *       '500':
   *         description: Error interno del servidor.
   */
  router.get("/plans", planController.listPlans);

  /**
   * @swagger
   * /plans/{id}:
   *   get:
   *     summary: Obtiene un plan por su ID
   *     description: Retorna los detalles de un plan específico.
   *     tags: [Planes]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           description: ObjectId de MongoDB (24 caracteres hex)
   *       - in: query
   *         name: tenantId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Identificador del tenant
   *     responses:
   *       '200':
   *         description: Plan obtenido exitosamente.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/PlanResponseDTO'
   *       '400':
   *         description: Parámetros inválidos.
   *       '404':
   *         description: Plan no encontrado.
   *       '500':
   *         description: Error interno del servidor.
   */
  router.get('/plans/:id', planController.getPlanById)

  /**
   * @swagger
   * /plans/{id}:
   *   delete:
   *     summary: Elimina (soft delete) un plan por su ID
   *     description: Marca el plan como INACTIVO.
   *     tags: [Planes]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           description: ObjectId de MongoDB (24 caracteres hex)
   *       - in: query
   *         name: tenantId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Identificador del tenant
   *     responses:
   *       '200':
   *         description: Plan eliminado exitosamente.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *       '400':
   *         description: Parámetros inválidos.
   *       '404':
   *         description: Plan no encontrado.
   *       '500':
   *         description: Error interno del servidor.
   */
  router.delete(
    '/plans/:id', 
    //authMiddleware, 
    //requireRole(['ADMINISTRADOR']), 
    planController.deletePlan
  );

  /**
   * @swagger
   * /plans/{id}:
   *   put:
   *     summary: Actualiza parcialmente un plan por su ID
   *     description: Actualiza campos del plan. Debe enviarse al menos un campo a modificar.
   *     tags: [Planes]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           description: ObjectId de MongoDB (24 caracteres hex)
   *       - in: query
   *         name: tenantId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Identificador del tenant
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nombre:
   *                 type: string
   *               descripcion:
   *                 type: string
   *               precio:
   *                 type: object
   *                 properties:
   *                   valor:
   *                     type: integer
   *                   moneda:
   *                     type: string
   *                     enum: [COP, USD]
   *               duracion:
   *                 type: integer
   *               cupoMaximo:
   *                 type: integer
   *               fechasDisponibles:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     desde:
   *                       type: string
   *                       format: date-time
   *                     hasta:
   *                       type: string
   *                       format: date-time
   *               estado:
   *                 type: string
   *                 enum: [ACTIVO, INACTIVO]
   *     responses:
   *       '200':
   *         description: Plan actualizado exitosamente.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/PlanResponseDTO'
   *       '400':
   *         description: Datos inválidos o falta de campos a actualizar.
   *       '404':
   *         description: Plan no encontrado.
   *       '500':
   *         description: Error interno del servidor.
   */
  router.put(
    '/plans/:id', 
    //authMiddleware, 
    //requireRole(['ADMINISTRADOR']), 
    planController.updatePlan
  )

  return router;
}
