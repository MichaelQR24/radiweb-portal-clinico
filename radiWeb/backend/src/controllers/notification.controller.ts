import { Request, Response } from 'express';
import { getPool } from '../config/db.config';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * GET /api/notifications
 * Devuelve todas las notificaciones NO leídas del usuario autenticado.
 */
export async function getMyNotifications(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const pool = await getPool();

    if (!pool) {
      // Modo mock: devuelve array vacío
      sendSuccess(res, [], 'Notificaciones obtenidas');
      return;
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, message, is_read, created_at
       FROM Notifications
       WHERE user_id = ? AND is_read = FALSE
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    sendSuccess(res, rows, 'Notificaciones obtenidas');
  } catch {
    sendError(res, 'Error obteniendo notificaciones', 500);
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Marca una notificación como leída. Solo el dueño puede hacerlo.
 */
export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] ?? '0', 10);
    const userId = req.user!.userId;
    const pool = await getPool();

    if (!pool) {
      sendSuccess(res, { id }, 'Notificación marcada como leída (mock)');
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE Notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      sendError(res, 'Notificación no encontrada o sin permisos', 404);
      return;
    }

    sendSuccess(res, { id }, 'Notificación marcada como leída');
  } catch {
    sendError(res, 'Error actualizando notificación', 500);
  }
}
