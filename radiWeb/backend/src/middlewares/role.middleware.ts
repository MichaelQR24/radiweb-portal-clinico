import { Request, Response, NextFunction, RequestHandler } from 'express';
import { UserRole } from '../models/user.model';
import { sendError } from '../utils/responseHelper';

/**
 * Factory de middleware RBAC.
 * Crea un middleware que verifica que el usuario autenticado tenga uno de los roles permitidos.
 * @param allowedRoles - Roles que tienen acceso al recurso
 */
export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Usuario no autenticado', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`,
        403
      );
      return;
    }

    next();
  };
}
