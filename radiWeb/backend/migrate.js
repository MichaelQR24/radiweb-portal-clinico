const mysql = require('mysql2/promise');
const crypto = require('crypto');
const path = require('path');

// Cargar variables de entorno desde el archivo .env del backend
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const SEPARATOR = ':';

/**
 * Obtiene la clave AES de 32 bytes de la misma forma que en backend/src/utils/encryption.util.ts
 */
function getKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.trim() === '') {
    throw new Error('[Encryption] ENCRYPTION_KEY no está definida en el .env.');
  }
  return crypto.createHash('sha256').update(raw).digest();
}

/**
 * Descifra el DNI de la misma forma que en backend/src/utils/encryption.util.ts
 */
function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;
  if (!encryptedText.includes(SEPARATOR)) return encryptedText;

  const key = getKey();
  const [ivHex, encryptedHex] = encryptedText.split(SEPARATOR);

  if (!ivHex || !encryptedHex) return encryptedText;

  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

async function run() {
  console.log('🚀 Iniciando script de migración para Blind Index de Pacientes...');

  // Configuración de la conexión a MySQL desde variables de entorno
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'radiweb_db',
    port: parseInt(process.env.DB_PORT || '3306', 10),
  };

  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  if (!ENCRYPTION_KEY) {
    console.error('❌ Error: ENCRYPTION_KEY no está configurada en las variables de entorno.');
    process.exit(1);
  }

  console.log(`Conectando a MySQL en ${dbConfig.host}:${dbConfig.port} (BD: ${dbConfig.database})...`);

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a base de datos establecida.');

    // 1. Obtener pacientes que tienen dni_blind_index sin completar
    const [patients] = await connection.query(
      'SELECT id, dni FROM Patients WHERE dni_blind_index IS NULL'
    );

    if (patients.length === 0) {
      console.log('✨ No se encontraron registros pendientes de migración (dni_blind_index ya está completo).');
      return;
    }

    console.log(`Se encontraron ${patients.length} paciente(s) para migrar.`);

    let successCount = 0;
    let failCount = 0;

    for (const patient of patients) {
      try {
        let dniRaw = patient.dni;

        // Si el DNI está encriptado (formato "ivHex:cipherHex"), lo desciframos
        if (dniRaw.includes(SEPARATOR)) {
          dniRaw = decrypt(dniRaw);
        }

        dniRaw = dniRaw.trim();

        // Validar formato del DNI descifrado o plano (8 dígitos)
        if (!/^\d{8}$/.test(dniRaw)) {
          console.warn(`⚠️ Paciente ID ${patient.id}: DNI con formato inusual: "${dniRaw}"`);
        }

        // Calcular el Blind Index usando HMAC-SHA256 con la ENCRYPTION_KEY
        const dniBlindIndex = crypto
          .createHmac('sha256', ENCRYPTION_KEY)
          .update(dniRaw)
          .digest('hex');

        // Guardar el Blind Index calculado en la base de datos
        await connection.query(
          'UPDATE Patients SET dni_blind_index = ? WHERE id = ?',
          [dniBlindIndex, patient.id]
        );

        console.log(`[OK] Paciente ID ${patient.id} migrado con éxito. DNI: ${dniRaw.slice(0, 3)}*****`);
        successCount++;
      } catch (err) {
        console.error(`[ERROR] Paciente ID ${patient.id} falló durante la migración:`, err.message);
        failCount++;
      }
    }

    console.log('\n==================================================');
    console.log('📊 RESUMEN DE LA EJECUCIÓN:');
    console.log(`- Pacientes procesados: ${patients.length}`);
    console.log(`- Exitosos (OK): ${successCount} ✅`);
    console.log(`- Fallidos (Error): ${failCount} ❌`);
    console.log('==================================================');

  } catch (error) {
    console.error('❌ Error crítico de base de datos:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión a MySQL cerrada.');
    }
  }
}

run();
