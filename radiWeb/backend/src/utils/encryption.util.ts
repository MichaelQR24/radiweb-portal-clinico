import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

/**
 * Utilidad de cifrado AES-256-CBC para datos médicos sensibles.
 *
 * Cómo funciona:
 *  - Se genera un IV (vector de inicialización) aleatorio de 16 bytes por cada cifrado.
 *  - El resultado se guarda como "iv:textoCifrado" en base64, separado por ":".
 *  - Al descifrar, se separa el IV del texto cifrado para reconstruir el mensaje.
 *
 * Variable de entorno requerida:
 *  ENCRYPTION_KEY — debe tener exactamente 32 bytes en hex (64 caracteres hex = 256 bits).
 *
 * Si ENCRYPTION_KEY no está configurada, el servicio lanza un error al arrancar
 * para evitar guardar datos sin cifrar silenciosamente.
 */

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size en bytes
const SEPARATOR = ':';

/**
 * Deriva una clave de 32 bytes a partir de ENCRYPTION_KEY.
 * Acepta cualquier longitud de string haciéndole SHA-256.
 * Esto permite que el dev ponga cualquier frase en el .env sin
 * preocuparse por la longitud exacta.
 */
function getKey(): Buffer {
  const raw = process.env['ENCRYPTION_KEY'];
  if (!raw || raw.trim() === '') {
    throw new Error(
      '[Encryption] ENCRYPTION_KEY no está definida en el .env. ' +
      'Este valor es obligatorio para proteger los datos médicos sensibles.'
    );
  }
  // SHA-256 produce siempre 32 bytes → clave AES-256 válida
  return createHash('sha256').update(raw).digest();
}

/**
 * Cifra un texto plano con AES-256-CBC.
 * @param text - El texto a cifrar (ej: nombre, DNI)
 * @returns String en formato "ivHex:cipherHex" listo para guardar en MySQL
 */
export function encrypt(text: string): string {
  if (!text) return text; // No cifrar strings vacíos/nulos

  const key = getKey();
  const iv  = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);

  // Guardar IV + datos cifrados juntos, ambos en hex
  return `${iv.toString('hex')}${SEPARATOR}${encrypted.toString('hex')}`;
}

/**
 * Descifra un texto cifrado previamente con encrypt().
 * @param encryptedText - String en formato "ivHex:cipherHex"
 * @returns El texto original en claro
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText; // No descifrar strings vacíos

  // Tolerancia: si el valor no tiene el separador esperado,
  // asumimos que aún no está cifrado (datos legacy) y lo devolvemos tal cual.
  if (!encryptedText.includes(SEPARATOR)) return encryptedText;

  const key = getKey();
  const [ivHex, encryptedHex] = encryptedText.split(SEPARATOR);

  if (!ivHex || !encryptedHex) return encryptedText;

  const iv        = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher  = createDecipheriv(ALGORITHM, key, iv);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
