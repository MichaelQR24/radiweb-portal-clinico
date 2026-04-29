import { getPool } from '../config/db.config';
import { AuditLog } from '../models/audit-log.model';
import { logger } from '../utils/logger';
import { RowDataPacket } from 'mysql2';

/**
 * Registra una acción en la tabla AuditLogs.
 * No lanza excepción si falla – la auditoría no debe interrumpir el flujo principal.
 */
export async function logAction(
  userId: number,
  action: string,
  entity: string,
  entityId: number | null,
  ipAddress: string
): Promise<void> {
  try {
    const pool = await getPool();
    if (!pool) {
      // Modo mock: solo registrar en consola
      logger.info(`[AUDIT-MOCK] User:${userId} – ${action} – ${entity}:${entityId ?? 'N/A'} – IP:${ipAddress}`);
      return;
    }

    await pool.execute(`
        INSERT INTO AuditLogs (user_id, action, entity, entity_id, ip_address, timestamp)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [userId, action, entity, entityId, ipAddress]);
  } catch (error) {
    logger.error('Error registrando en AuditLog:', error);
    // No relanzar el error
  }
}

/**
 * Obtiene el registro de auditoría paginado (solo admin).
 */
export async function getAuditLogs(
  page: number,
  limit: number,
  filters?: { userId?: number; entity?: string; dateFrom?: string; dateTo?: string }
): Promise<{ records: AuditLog[]; total: number }> {
  const pool = await getPool();

  // Datos mock para desarrollo
  if (!pool) {
    const mockRecords: AuditLog[] = [
      { id: 1, user_id: 1, action: 'LOGIN', entity: 'User', entity_id: 1, ip_address: '127.0.0.1', timestamp: new Date(), user_name: 'Admin', user_email: 'admin@radiweb.pe' },
      { id: 2, user_id: 2, action: 'CREATE_STUDY', entity: 'Study', entity_id: 1, ip_address: '127.0.0.1', timestamp: new Date(Date.now() - 3600000), user_name: 'Tecnólogo Demo', user_email: 'tecnologo@radiweb.pe' },
      { id: 3, user_id: 3, action: 'UPLOAD_IMAGE', entity: 'Image', entity_id: 1, ip_address: '127.0.0.1', timestamp: new Date(Date.now() - 7200000), user_name: 'Radiólogo Demo', user_email: 'radiologo@radiweb.pe' },
    ];
    return { records: mockRecords, total: mockRecords.length };
  }

  let whereClause = 'WHERE 1=1';
  const queryParams: any[] = [];
  const countParams: any[] = [];

  if (filters?.userId) {
    whereClause += ' AND al.user_id = ?';
    queryParams.push(filters.userId);
    countParams.push(filters.userId);
  }
  if (filters?.entity) {
    whereClause += ' AND al.entity = ?';
    queryParams.push(filters.entity);
    countParams.push(filters.entity);
  }
  if (filters?.dateFrom) {
    whereClause += ' AND al.timestamp >= ?';
    const dateFrom = new Date(filters.dateFrom);
    queryParams.push(dateFrom);
    countParams.push(dateFrom);
  }
  if (filters?.dateTo) {
    whereClause += ' AND al.timestamp <= ?';
    const dateTo = new Date(filters.dateTo);
    queryParams.push(dateTo);
    countParams.push(dateTo);
  }

  const offset = (page - 1) * limit;
  queryParams.push(limit, offset);

  // mysql2 no soporta multiple statements por defecto en execute, mejor usar query si está habilitado o ejecutar dos llamadas.
  // Es más seguro y portable ejecutar dos veces.
  
  const [dataRows] = await pool.execute<RowDataPacket[]>(`
    SELECT al.*, u.name as user_name, u.email as user_email
    FROM AuditLogs al
    LEFT JOIN Users u ON al.user_id = u.id
    ${whereClause}
    ORDER BY al.timestamp DESC
    LIMIT ? OFFSET ?
  `, queryParams);

  const [countRows] = await pool.execute<RowDataPacket[]>(`
    SELECT COUNT(*) as total FROM AuditLogs al ${whereClause}
  `, countParams);

  return {
    records: dataRows as AuditLog[],
    total: countRows[0]?.total ?? 0,
  };
}
