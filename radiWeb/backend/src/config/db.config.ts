import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

// Configuración de la conexión a MySQL Database
const dbConfig: mysql.PoolOptions = {
  host: process.env['DB_HOST'] ?? 'localhost',
  user: process.env['DB_USER'] ?? 'root',
  password: process.env['DB_PASSWORD'] ?? '',
  database: process.env['DB_NAME'] ?? 'radiweb_db',
  port: parseInt(process.env['DB_PORT'] ?? '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
};

let pool: mysql.Pool | null = null;

/**
 * Obtiene o crea el pool de conexiones a la base de datos.
 * Retorna null en modo desarrollo sin credenciales configuradas.
 */
export async function getPool(): Promise<mysql.Pool | null> {
  // En desarrollo sin credenciales, usar datos mock
  if (!process.env['DB_HOST'] || process.env['DB_HOST'] === 'localhost') {
    if (process.env['NODE_ENV'] === 'development' && !process.env['DB_PASSWORD']) {
       // Permite conectarse a localhost si hay contraseña, asumiendo que es una BD local real
      return null;
    }
  }

  if (pool) {
    return pool;
  }

  try {
    pool = mysql.createPool(dbConfig);
    
    // Testeamos la conexión
    const connection = await pool.getConnection();
    logger.info('✅ Conexión a MySQL establecida');
    connection.release();
    
    return pool;
  } catch (error) {
    logger.error('❌ Error conectando a MySQL:', error);
    pool = null; // Reseteamos el pool si falla
    throw error;
  }
}

/**
 * Cierra el pool de conexiones (útil al apagar el servidor).
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('🔌 Pool de conexiones cerrado');
  }
}

export { mysql };
