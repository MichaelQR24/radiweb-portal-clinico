/**
 * ===================================================================
 * Pruebas Unitarias – RadiWeb JWT Config
 * Archivo: src/config/__tests__/jwt.config.test.ts
 *
 * Funciones testeadas:
 *   - signAccessToken(payload)
 *   - verifyAccessToken(token)
 *   - signRefreshToken(payload)
 *   - verifyRefreshToken(token)
 *
 * Características de estos tests:
 *   ✓ Sin dependencias de base de datos
 *   ✓ Sin dependencias de Azure
 *   ✓ Sin variables de entorno requeridas (usa fallback hardcodeado)
 *   ✓ Sin Express / HTTP
 *   ✓ Funcionan completamente offline
 *
 * Nota: jwt.config.ts tiene fallbacks hardcodeados para JWT_SECRET y
 * JWT_REFRESH_SECRET, por lo que estos tests funcionan sin ningún .env.
 * ===================================================================
 */

import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  JwtPayload,
} from '../jwt.config';

// ─── Payload de prueba estándar usado en la mayoría de tests ─────────────────
const TEST_PAYLOAD: Omit<JwtPayload, 'iat' | 'exp'> = {
  userId: 42,
  email: 'radiologo@radiweb.pe',
  role: 'radiologo',
};

const ADMIN_PAYLOAD: Omit<JwtPayload, 'iat' | 'exp'> = {
  userId: 1,
  email: 'admin@radiweb.pe',
  role: 'admin',
};

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: signAccessToken()
// ─────────────────────────────────────────────────────────────────────────────
describe('signAccessToken()', () => {
  /**
   * TEST 1: La función debe retornar un string no vacío.
   * Un JWT válido siempre empieza con "eyJ" (base64 de {"alg":"HS256","typ":"JWT"}).
   */
  it('debería retornar un JWT string que empieza con "eyJ"', () => {
    const token = signAccessToken(TEST_PAYLOAD);
    const cumple = typeof token === 'string' && token.length > 0 && token.startsWith('eyJ');

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'El token es de tipo string, no está vacío y comienza con el prefijo "eyJ" que indica la codificación Base64Url del header estándar de JWT.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', 'El token generado no es un string válido o no posee el prefijo estándar de un JWT.');
    }

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    expect(token.startsWith('eyJ')).toBe(true);
  });

  /**
   * TEST 2: Un JWT siempre tiene exactamente 3 partes separadas por punto.
   * Formato: header.payload.signature
   */
  it('debería retornar un token con exactamente 3 segmentos separados por punto', () => {
    const token = signAccessToken(TEST_PAYLOAD);
    const parts = token.split('.');
    const cumple = parts.length === 3;

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'El token JWT tiene exactamente 3 partes (header, payload y firma) separadas por puntos según la especificación RFC 7519.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', `El token contiene un número inválido de segmentos: ${parts.length} en lugar de 3.`);
    }

    expect(parts).toHaveLength(3);
  });

  /**
   * TEST 3: Dos tokens generados con el mismo payload en momentos distintos
   * deben ser diferentes (por la claim "iat" – issued at timestamp).
   */
  it('debería generar tokens distintos en llamadas sucesivas (iat diferente)', async () => {
    const token1 = signAccessToken(TEST_PAYLOAD);
    // Pequeña espera para asegurar diferencia en timestamp
    await new Promise((r) => setTimeout(r, 1100));
    const token2 = signAccessToken(TEST_PAYLOAD);
    const cumple = token1 !== token2;

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'Los tokens generados son diferentes debido a que el valor de la claim "iat" (issued at) se actualizó en el transcurso del tiempo transcurrido.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', 'Los tokens resultantes son idénticos a pesar del retardo de tiempo.');
    }

    expect(token1).not.toBe(token2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: verifyAccessToken()
// ─────────────────────────────────────────────────────────────────────────────
describe('verifyAccessToken()', () => {
  /**
   * TEST 4: El ciclo completo sign → verify debe recuperar el payload original.
   * Esta es la prueba más importante: garantiza la integridad del sistema de auth.
   */
  it('debería recuperar correctamente userId, email y role del payload original', () => {
    const token = signAccessToken(TEST_PAYLOAD);
    const decoded = verifyAccessToken(token);
    const cumple = decoded.userId === TEST_PAYLOAD.userId &&
                   decoded.email === TEST_PAYLOAD.email &&
                   decoded.role === TEST_PAYLOAD.role;

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'El proceso de firma y posterior verificación es simétrico, recuperando intactos los campos userId, email y role originales.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', `Los datos decodificados no coinciden. Decodificado: ${JSON.stringify(decoded)}`);
    }

    expect(decoded.userId).toBe(TEST_PAYLOAD.userId);
    expect(decoded.email).toBe(TEST_PAYLOAD.email);
    expect(decoded.role).toBe(TEST_PAYLOAD.role);
  });

  /**
   * TEST 5: El token decodificado debe incluir las claims estándar JWT:
   * - iat (issued at): timestamp de creación
   * - exp (expires at): timestamp de expiración
   */
  it('debería incluir las claims estándar iat y exp en el payload decodificado', () => {
    const token = signAccessToken(TEST_PAYLOAD);
    const decoded = verifyAccessToken(token);
    const cumple = decoded.iat !== undefined &&
                   decoded.exp !== undefined &&
                   typeof decoded.iat === 'number' &&
                   typeof decoded.exp === 'number' &&
                   decoded.exp > decoded.iat;

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'El payload decodificado contiene las propiedades numéricas "iat" y "exp" necesarias para gestionar el tiempo de vida del token, cumpliendo que "exp" es mayor a "iat".');
    } else {
      console.log('\n  ❌ NO CUMPLE:', `Claims de tiempo de vida ausentes o inválidas: iat=${decoded.iat}, exp=${decoded.exp}`);
    }

    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
    expect(typeof decoded.iat).toBe('number');
    expect(typeof decoded.exp).toBe('number');
    // exp debe ser mayor que iat (el token no ha expirado)
    expect(decoded.exp!).toBeGreaterThan(decoded.iat!);
  });

  /**
   * TEST 6: Un token corrupto (string aleatorio) debe lanzar un error.
   * Esto protege los endpoints de tokens manipulados.
   */
  it('debería lanzar un error para un token completamente inválido', () => {
    let lanzoError = false;
    try {
      verifyAccessToken('token.completamente.invalido');
    } catch (error) {
      lanzoError = true;
    }

    const cumple = lanzoError === true;

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'Intentar verificar un token corrupto e inválido lanza una excepción en lugar de permitir el acceso, garantizando la seguridad.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', 'No se lanzó ninguna excepción al intentar verificar un token con formato totalmente inválido.');
    }

    expect(() => verifyAccessToken('token.completamente.invalido')).toThrow();
  });

  /**
   * TEST 7: Un refresh token NO debe poder verificarse con verifyAccessToken.
   * Los dos tipos de token usan secretos diferentes → protección cruzada.
   */
  it('debería lanzar un error si se intenta verificar un refresh token como access token', () => {
    const refreshToken = signRefreshToken(TEST_PAYLOAD);
    let lanzoError = false;
    try {
      verifyAccessToken(refreshToken);
    } catch (error) {
      lanzoError = true;
    }

    const cumple = lanzoError === true;

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'El refresh token es rechazado exitosamente por verifyAccessToken ya que fue firmado con un secreto distinto, evitando la confusión de tipos de token.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', 'Se aceptó o no arrojó error un refresh token al ser verificado como un access token.');
    }

    expect(() => verifyAccessToken(refreshToken)).toThrow();
  });

  /**
   * TEST 8: Payload con rol 'admin' debe ser preservado correctamente.
   */
  it('debería preservar correctamente el rol "admin" en el payload', () => {
    const token = signAccessToken(ADMIN_PAYLOAD);
    const decoded = verifyAccessToken(token);
    const cumple = decoded.role === 'admin' && decoded.userId === 1;

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'El payload codificado con rol de administrador preserva las propiedades específicas "admin" e ID correctos después de la verificación.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', `El rol de administrador no se recuperó correctamente. Decodificado: ${JSON.stringify(decoded)}`);
    }

    expect(decoded.role).toBe('admin');
    expect(decoded.userId).toBe(1);
  });

  /**
   * TEST 9: Token con un carácter modificado debe ser detectado como inválido
   * (la firma HMAC ya no coincide).
   */
  it('debería lanzar un error si el token fue manipulado (un carácter cambiado)', () => {
    const token = signAccessToken(TEST_PAYLOAD);
    // Cambiar el último carácter de la firma
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
    let lanzoError = false;
    try {
      verifyAccessToken(tampered);
    } catch (error) {
      lanzoError = true;
    }

    const cumple = lanzoError === true;

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'Cualquier modificación o alteración en la firma del token (incluso de un solo carácter) invalida la integridad criptográfica y provoca un fallo controlado.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', 'Se validó con éxito un token manipulado con firma modificada.');
    }

    expect(() => verifyAccessToken(tampered)).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: signRefreshToken() + verifyRefreshToken()
// ─────────────────────────────────────────────────────────────────────────────
describe('signRefreshToken() + verifyRefreshToken()', () => {
  /**
   * TEST 10: El ciclo completo de refresh token debe funcionar correctamente.
   */
  it('debería recuperar el payload original con el ciclo sign/verify de refresh', () => {
    const token = signRefreshToken(TEST_PAYLOAD);
    const decoded = verifyRefreshToken(token);
    const cumple = decoded.userId === TEST_PAYLOAD.userId &&
                   decoded.email === TEST_PAYLOAD.email &&
                   decoded.role === TEST_PAYLOAD.role;

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'El ciclo completo de firma y verificación de Refresh Token mantiene la fidelidad e integridad del payload del usuario.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', `Los datos del Refresh Token decodificado no coinciden. Decodificado: ${JSON.stringify(decoded)}`);
    }

    expect(decoded.userId).toBe(TEST_PAYLOAD.userId);
    expect(decoded.email).toBe(TEST_PAYLOAD.email);
    expect(decoded.role).toBe(TEST_PAYLOAD.role);
  });

  /**
   * TEST 11: Un access token NO debe poder verificarse como refresh token.
   * Protección inversa: cada tipo de token solo es válido con su propio secreto.
   */
  it('debería lanzar un error si se verifica un access token como refresh token', () => {
    const accessToken = signAccessToken(TEST_PAYLOAD);
    let lanzoError = false;
    try {
      verifyRefreshToken(accessToken);
    } catch (error) {
      lanzoError = true;
    }

    const cumple = lanzoError === true;

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'El Access Token es rechazado correctamente por verifyRefreshToken al utilizar una clave secreta y contexto de firma separados.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', 'Se validó con éxito un Access Token en el proceso de verificación de Refresh Token.');
    }

    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });

  /**
   * TEST 12: El refresh token debe ser un JWT con estructura válida (3 partes).
   */
  it('el refresh token debe tener estructura JWT válida con 3 segmentos', () => {
    const token = signRefreshToken(ADMIN_PAYLOAD);
    const parts = token.split('.');
    const cumple = parts.length === 3 && token.startsWith('eyJ');

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'El Refresh Token conserva la misma estructura estándar de tres segmentos y el prefijo de cabecera codificada que un Access Token.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', `La estructura o el formato del refresh token generado es incorrecto: ${token}`);
    }

    expect(parts).toHaveLength(3);
    expect(token.startsWith('eyJ')).toBe(true);
  });
});
