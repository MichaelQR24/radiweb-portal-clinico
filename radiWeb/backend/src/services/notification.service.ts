import { getPool } from '../config/db.config';
import { logger } from '../utils/logger';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Crea una notificación para un usuario específico vinculada opcionalmente a un estudio.
 * Si no hay pool (modo mock), registra en log y continúa silenciosamente.
 */
export async function createNotification(
  userId: number,
  message: string,
  studyId: number | null = null
): Promise<void> {
  try {
    const pool = await getPool();
    if (!pool) {
      logger.info(`[MOCK] Notificación para user ${userId} (Estudio: ${studyId}): ${message}`);
      return;
    }
    await pool.execute(
      'INSERT INTO Notifications (user_id, message, study_id, is_read, created_at) VALUES (?, ?, ?, FALSE, NOW())',
      [userId, message, studyId]
    );
  } catch (err) {
    logger.error('Error creando notificación:', err);
  }
}

/**
 * Crea una notificación para todos los usuarios activos con un rol específico.
 */
export async function notifyRole(
  role: string,
  message: string,
  studyId: number | null = null
): Promise<void> {
  try {
    const pool = await getPool();
    if (!pool) {
      logger.info(`[MOCK] Notificación masiva a rol "${role}" (Estudio: ${studyId}): ${message}`);
      return;
    }
    // Obtener todos los usuarios activos con el rol dado
    const [users] = await pool.execute<{ id: number }[] & any[]>(
      'SELECT id FROM Users WHERE role = ? AND is_active = TRUE',
      [role]
    );
    // Insertar una notificación por cada usuario encontrado
    for (const user of users) {
      await pool.execute(
        'INSERT INTO Notifications (user_id, message, study_id, is_read, created_at) VALUES (?, ?, ?, FALSE, NOW())',
        [user.id, message, studyId]
      );
    }
  } catch (err) {
    logger.error(`Error notificando al rol "${role}":`, err);
  }
}

/**
 * Obtiene las últimas 100 notificaciones para un usuario.
 * Si el rol del usuario es 'admin', devuelve todas las notificaciones del sistema con el nombre del destinatario.
 */
export async function getNotificationsForUser(userId: number, role: string): Promise<any[]> {
  try {
    const pool = await getPool();
    if (!pool) {
      // Fallback de desarrollo
      return [];
    }

    if (role === 'admin') {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT n.*, u.name as recipient_name
         FROM Notifications n
         LEFT JOIN Users u ON n.user_id = u.id
         ORDER BY n.created_at DESC
         LIMIT 100`
      );
      return rows;
    } else {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT n.*, u.name as recipient_name
         FROM Notifications n
         LEFT JOIN Users u ON n.user_id = u.id
         WHERE n.user_id = ?
         ORDER BY n.created_at DESC
         LIMIT 100`,
        [userId]
      );
      return rows;
    }
  } catch (err) {
    logger.error('Error obteniendo notificaciones:', err);
    return [];
  }
}

/**
 * Marca una notificación como leída.
 * Si el rol no es admin, se asegura de que pertenezca al usuario solicitante.
 */
export async function markAsRead(notificationId: number, userId: number, role: string): Promise<boolean> {
  try {
    const pool = await getPool();
    if (!pool) return true;

    let result;
    if (role === 'admin') {
      [result] = await pool.execute<ResultSetHeader>(
        'UPDATE Notifications SET is_read = TRUE WHERE id = ?',
        [notificationId]
      );
    } else {
      [result] = await pool.execute<ResultSetHeader>(
        'UPDATE Notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
        [notificationId, userId]
      );
    }
    return result.affectedRows > 0;
  } catch (err) {
    logger.error(`Error al marcar notificación ${notificationId} como leída:`, err);
    return false;
  }
}

/**
 * Marca todas las notificaciones como leídas.
 * Si es admin, marca todas las notificaciones del sistema como leídas.
 * De lo contrario, solo marca las notificaciones del propio usuario.
 */
export async function markAllAsRead(userId: number, role: string): Promise<boolean> {
  try {
    const pool = await getPool();
    if (!pool) return true;

    let result;
    if (role === 'admin') {
      [result] = await pool.execute<ResultSetHeader>(
        'UPDATE Notifications SET is_read = TRUE'
      );
    } else {
      [result] = await pool.execute<ResultSetHeader>(
        'UPDATE Notifications SET is_read = TRUE WHERE user_id = ?',
        [userId]
      );
    }
    return result.affectedRows > 0;
  } catch (err) {
    logger.error('Error al marcar todas las notificaciones como leídas:', err);
    return false;
  }
}
