import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  errors?: unknown[];
}

/**
 * Middleware centralizado de manejo de errores.
 * Debe ser el último middleware registrado en Express.
 */
export function errorMiddleware(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message =
    process.env['NODE_ENV'] === 'production' && statusCode === 500
      ? 'Error interno del servidor. Por favor contacte al administrador.'
      : err.message;

  logger.error(`[${req.method}] ${req.path} – ${err.message}`, {
    statusCode,
    stack: err.stack,
    body: req.body,
    params: req.params,
  });

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors,
    ...(process.env['NODE_ENV'] !== 'production' && { stack: err.stack }),
  });
}
