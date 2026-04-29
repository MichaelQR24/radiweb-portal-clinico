import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  errors?: unknown[];
}

/**
 * Envía una respuesta exitosa estandarizada.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Operación exitosa',
  statusCode = 200
): void {
  const response: ApiResponse<T> = { success: true, data, message };
  res.status(statusCode).json(response);
}

/**
 * Envía una respuesta de error estandarizada.
 */
export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown[]
): void {
  const response: ApiResponse = { success: false, message, errors };
  res.status(statusCode).json(response);
}
