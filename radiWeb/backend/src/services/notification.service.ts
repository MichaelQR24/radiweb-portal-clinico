import { getPool } from '../config/db.config';
import { logger } from '../utils/logger';

/**
 * Crea una notificación para un usuario específico.
 * Si no hay pool (modo mock), registra en log y continúa silenciosamente.
 */
export async function createNotification(userId: number, message: string): Promise<void> {
  try {
    const pool = await getPool();
    if (!pool) {
      logger.info(`[MOCK] Notificación para user ${userId}: ${message}`);
      return;
    }
    await pool.execute(
      'INSERT INTO Notifications (user_id, message, is_read, created_at) VALUES (?, ?, FALSE, NOW())',
      [userId, message]
    );
  } catch (err) {
    // Las notificaciones nunca deben romper el flujo principal
    logger.error('Error creando notificación:', err);
  }
}

/**
 * Crea una notificación para todos los usuarios con un rol específico.
 */
export async function notifyRole(role: string, message: string): Promise<void> {
  try {
    const pool = await getPool();
    if (!pool) {
      logger.info(`[MOCK] Notificación masiva a rol "${role}": ${message}`);
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
        'INSERT INTO Notifications (user_id, message, is_read, created_at) VALUES (?, ?, FALSE, NOW())',
        [user.id, message]
      );
    }
  } catch (err) {
    logger.error(`Error notificando al rol "${role}":`, err);
  }
}
