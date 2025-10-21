// adapters/http/middlewares/authMiddleware.ts

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Extender tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
        tenantId: string
      }
      logger?: any
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Token no proporcionado' })
      return
    }

    const token = authHeader.split(' ')[1]

    // TODO: En producción, validar contra Auth0
    // Por ahora, decodificar JWT local
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId
    }
    next()
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado' })
  }
}
