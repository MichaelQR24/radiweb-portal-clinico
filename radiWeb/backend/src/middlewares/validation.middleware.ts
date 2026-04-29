import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendError } from '../utils/responseHelper';

/**
 * Middleware que verifica los resultados de express-validator.
 * Debe colocarse después de los esquemas de validación en las rutas.
 */
export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    sendError(
      res,
      'Los datos enviados no son válidos. Por favor revise los campos indicados.',
      400,
      errors.array()
    );
    return;
  }

  next();
}
