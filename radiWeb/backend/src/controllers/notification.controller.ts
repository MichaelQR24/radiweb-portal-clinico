import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/responseHelper';
import {
  getNotificationsForUser,
  markAsRead as serviceMarkAsRead,
  markAllAsRead as serviceMarkAllAsRead,
} from '../services/notification.service';

/**
 * GET /api/notifications
 * Devuelve las notificaciones del usuario autenticado (todas si es admin).
 */
export async function getMyNotifications(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    const notifications = await getNotificationsForUser(userId, role);
    sendSuccess(res, notifications, 'Notificaciones obtenidas');
  } catch (error) {
    sendError(res, 'Error obteniendo notificaciones', 500);
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Marca una notificación como leída.
 */
export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] ?? '0', 10);
    const userId = req.user!.userId;
    const role = req.user!.role;

    const success = await serviceMarkAsRead(id, userId, role);
    if (!success) {
      sendError(res, 'Notificación no encontrada o sin permisos', 404);
      return;
    }

    sendSuccess(res, { id }, 'Notificación marcada como leída');
  } catch (error) {
    sendError(res, 'Error actualizando notificación', 500);
  }
}

/**
 * PATCH /api/notifications/read-all
 * Marca todas las notificaciones como leídas.
 */
export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    await serviceMarkAllAsRead(userId, role);
    sendSuccess(res, null, 'Todas las notificaciones marcadas como leídas');
  } catch (error) {
    sendError(res, 'Error actualizando notificaciones', 500);
  }
}
