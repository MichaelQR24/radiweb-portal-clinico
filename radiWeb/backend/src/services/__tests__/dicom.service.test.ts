/**
 * ===================================================================
 * Pruebas Unitarias – RadiWeb DICOM Service
 * Archivo: src/services/__tests__/dicom.service.test.ts
 *
 * Funciones testeadas:
 *   - isValidDicom(buffer)
 *   - parseDicomMetadata(buffer)
 *
 * Características de estos tests:
 *   ✓ Sin dependencias de base de datos
 *   ✓ Sin dependencias de Azure
 *   ✓ Sin variables de entorno requeridas
 *   ✓ Sin Express / HTTP
 *   ✓ Funcionan completamente offline
 * ===================================================================
 */

import { isValidDicom, parseDicomMetadata } from '../dicom.service';

// ─── Helpers para construir buffers DICOM de prueba ───────────────────────────

/**
 * Crea un buffer que simula un archivo DICOM válido.
 * El formato DICOM requiere:
 *  - 128 bytes de preámbulo (cualquier valor, normalmente ceros)
 *  - Los bytes 128–131 deben contener exactamente 'DICM' en ASCII
 *  - Opcionalmente, más datos después del magic number
 */
function buildValidDicomBuffer(extraBytes = 0): Buffer {
  const size = 132 + extraBytes;
  const buf = Buffer.alloc(size, 0);
  // Escribir el magic number DICOM en los bytes 128–131
  buf.write('DICM', 128, 'ascii');
  return buf;
}

/**
 * Crea un buffer que simula un archivo PNG (no DICOM).
 * Los primeros 8 bytes de un PNG son el magic number PNG.
 */
function buildPngBuffer(): Buffer {
  const buf = Buffer.alloc(200, 0);
  // Magic number PNG: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  pngMagic.copy(buf, 0);
  return buf;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: isValidDicom(buffer)
// ─────────────────────────────────────────────────────────────────────────────
describe('isValidDicom()', () => {
  /**
   * TEST 1: Un buffer exactamente de 132 bytes con el magic 'DICM'
   * en la posición correcta debe ser reconocido como DICOM válido.
   */
  it('debería retornar TRUE para un buffer con magic DICM en posición 128', () => {
    const buf = buildValidDicomBuffer();
    const resultado = isValidDicom(buf);
    const cumple = resultado === true;

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'El buffer tiene el preámbulo correcto de 128 bytes seguido de la firma "DICM" de 4 bytes, sumando exactamente 132 bytes.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', 'El buffer con magic DICM en posición 128 no fue validado correctamente.');
    }

    expect(resultado).toBe(true);
  });

  /**
   * TEST 2: Buffer más grande (simulando un DICOM real con datos de imagen).
   * El tamaño adicional no debe afectar la validación del header.
   */
  it('debería retornar TRUE para un buffer DICOM más grande (con datos de imagen)', () => {
    const buf = buildValidDicomBuffer(1024); // 132 + 1024 = 1156 bytes
    const resultado = isValidDicom(buf);
    const cumple = resultado === true;

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'Un buffer de tamaño superior al mínimo (1156 bytes) es válido ya que mantiene los primeros 128 bytes y el identificador "DICM" en la posición correcta.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', 'El buffer de 1156 bytes con firma DICM válida no fue reconocido.');
    }

    expect(resultado).toBe(true);
  });

  /**
   * TEST 3: Un buffer PNG (200 bytes) no tiene el magic DICM en posición 128.
   * Debe ser rechazado aunque tenga más de 132 bytes.
   */
  it('debería retornar FALSE para un buffer de tipo PNG (no DICOM)', () => {
    const buf = buildPngBuffer();
    const resultado = isValidDicom(buf);
    const cumple = resultado === false;

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'El buffer PNG posee un magic number diferente y carece de la firma "DICM" en la posición 128, por lo que es rechazado correctamente.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', 'Se aceptó erróneamente un buffer de tipo PNG como si fuera un DICOM válido.');
    }

    expect(resultado).toBe(false);
  });

  /**
   * TEST 4: Buffer demasiado pequeño (50 bytes).
   * La función verifica que length >= 132 antes de leer el magic number.
   */
  it('debería retornar FALSE para un buffer de menos de 132 bytes', () => {
    const buf = Buffer.alloc(50, 0);
    const resultado = isValidDicom(buf);
    const cumple = resultado === false;

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'El buffer tiene solo 50 bytes, lo cual es inferior al mínimo requerido de 132 bytes (128 de preámbulo + 4 de firma) y se rechaza inmediatamente.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', 'Se validó un buffer de tamaño inferior a 132 bytes, lo cual es físicamente imposible para un DICOM válido.');
    }

    expect(resultado).toBe(false);
  });

  /**
   * TEST 5: Buffer exactamente de 131 bytes (un byte menos del mínimo requerido).
   * Caso borde: tamaño límite.
   */
  it('debería retornar FALSE para un buffer de exactamente 131 bytes (límite inferior)', () => {
    const buf = Buffer.alloc(131, 0);
    const resultado = isValidDicom(buf);
    const cumple = resultado === false;

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'Un buffer de 131 bytes se queda a un solo byte de cumplir con el tamaño mínimo absoluto (132 bytes) y es rechazado correctamente.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', 'Se validó incorrectamente un buffer de 131 bytes que no alcanza el tamaño mínimo necesario.');
    }

    expect(resultado).toBe(false);
  });

  /**
   * TEST 6: Buffer completamente vacío.
   * No debe lanzar excepción, debe retornar false graciosamente.
   */
  it('debería retornar FALSE para un Buffer vacío (0 bytes) sin lanzar excepción', () => {
    const buf = Buffer.alloc(0);
    let noLanzaException = false;
    let resultado = true;

    try {
      isValidDicom(buf);
      noLanzaException = true;
      resultado = isValidDicom(buf);
    } catch (e) {
      noLanzaException = false;
    }

    const cumple = noLanzaException && resultado === false;

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'El Buffer vacío se procesa de forma segura sin lanzar excepciones y retorna false dado que no posee la firma ni el tamaño requerido.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', 'El Buffer vacío lanzó una excepción o no retornó false al validarlo.');
    }

    expect(() => isValidDicom(buf)).not.toThrow();
    expect(isValidDicom(buf)).toBe(false);
  });

  /**
   * TEST 7: Buffer con 132 bytes pero magic incorrecto ("XXXX" en vez de "DICM").
   * Caso donde el tamaño es correcto pero el contenido no.
   */
  it('debería retornar FALSE si el magic es incorrecto aunque el buffer tenga 132+ bytes', () => {
    const buf = Buffer.alloc(132, 0);
    buf.write('XXXX', 128, 'ascii'); // Magic inválido
    const resultado = isValidDicom(buf);
    const cumple = resultado === false;

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'A pesar de cumplir con los 132 bytes necesarios, la firma leída en los bytes 128-131 es "XXXX" en lugar de "DICM", por lo que es rechazado de forma correcta.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', 'Se aceptó un buffer con magic number incorrecto.');
    }

    expect(resultado).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: parseDicomMetadata(buffer)
// ─────────────────────────────────────────────────────────────────────────────
describe('parseDicomMetadata()', () => {
  /**
   * TEST 8: Un buffer DICOM válido debe retornar los metadatos correctos.
   * El campo `format` debe ser 'DICOM' y `valid` debe ser 'true'.
   */
  it('debería retornar format=DICOM y valid=true para un buffer DICOM válido', () => {
    const buf = buildValidDicomBuffer();
    const metadata = parseDicomMetadata(buf);
    const cumple = metadata.format === 'DICOM' && metadata.valid === 'true' && metadata.transferSyntax === 'Implicitly detected';

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'El analizador identificó correctamente el formato "DICOM", marcó el archivo como válido y asignó la sintaxis de transferencia implícita esperada.');
    } else {
      console.log('\n  ❌ NO CUMPLE:', `El objeto de metadatos no coincide con lo esperado. Recibido: ${JSON.stringify(metadata)}`);
    }

    expect(metadata.format).toBe('DICOM');
    expect(metadata.valid).toBe('true');
    expect(metadata.transferSyntax).toBe('Implicitly detected');
  });

  /**
   * TEST 9: Un buffer demasiado pequeño (< 132 bytes) debe retornar UNKNOWN.
   */
  it('debería retornar format=UNKNOWN y valid=false para buffer menor a 132 bytes', () => {
    const buf = Buffer.alloc(100, 0);
    const metadata = parseDicomMetadata(buf);
    const cumple = metadata.format === 'UNKNOWN' && metadata.valid === 'false';

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'Para un buffer de 100 bytes (menor a 132 bytes), el analizador clasifica correctamente el formato como "UNKNOWN" y el estado de validez como "false".');
    } else {
      console.log('\n  ❌ NO CUMPLE:', `Se obtuvo un formato o validez incorrecto para un buffer corto: ${JSON.stringify(metadata)}`);
    }

    expect(metadata.format).toBe('UNKNOWN');
    expect(metadata.valid).toBe('false');
  });

  /**
   * TEST 10: Un buffer PNG (no DICOM) debe retornar NON-DICOM.
   */
  it('debería retornar format=NON-DICOM y valid=false para un buffer PNG', () => {
    const buf = buildPngBuffer();
    const metadata = parseDicomMetadata(buf);
    const cumple = metadata.format === 'NON-DICOM' && metadata.valid === 'false';

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'El analizador detectó que el buffer corresponde a un archivo PNG y no a un DICOM, clasificándolo correctamente como format: "NON-DICOM" y valid: "false".');
    } else {
      console.log('\n  ❌ NO CUMPLE:', `Error al clasificar el buffer PNG: ${JSON.stringify(metadata)}`);
    }

    expect(metadata.format).toBe('NON-DICOM');
    expect(metadata.valid).toBe('false');
  });

  /**
   * TEST 11: Buffer vacío - no debe lanzar excepción y debe retornar UNKNOWN.
   */
  it('debería manejar un buffer vacío sin lanzar excepción', () => {
    const buf = Buffer.alloc(0);
    let noLanzaException = false;
    let metadata: any;

    try {
      parseDicomMetadata(buf);
      noLanzaException = true;
      metadata = parseDicomMetadata(buf);
    } catch (e) {
      noLanzaException = false;
    }

    const cumple = noLanzaException && metadata && metadata.format === 'UNKNOWN' && metadata.valid === 'false';

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'Un buffer de 0 bytes es manejado de manera segura sin lanzar excepciones, retornando correctamente que el formato es "UNKNOWN" y no es válido ("false").');
    } else {
      console.log('\n  ❌ NO CUMPLE:', 'La función lanzó un error o retornó metadatos incorrectos para un buffer vacío.');
    }

    expect(() => parseDicomMetadata(buf)).not.toThrow();

    const metadataResult = parseDicomMetadata(buf);
    expect(metadataResult.format).toBe('UNKNOWN');
    expect(metadataResult.valid).toBe('false');
  });

  /**
   * TEST 12: El objeto de respuesta debe contener exactamente las claves esperadas
   * cuando el buffer es DICOM válido.
   */
  it('el objeto de metadatos DICOM válido debe tener las propiedades: format, valid, transferSyntax', () => {
    const buf = buildValidDicomBuffer();
    const metadata = parseDicomMetadata(buf);
    const cumple = ('format' in metadata) && ('valid' in metadata) && ('transferSyntax' in metadata);

    if (cumple) {
      console.log('\n  ✅ CUMPLE:', 'El objeto retornado contiene todas las claves requeridas por la interfaz de metadatos de DICOM (format, valid y transferSyntax).');
    } else {
      console.log('\n  ❌ NO CUMPLE:', 'El objeto de metadatos carece de alguna de las propiedades fundamentales esperadas.');
    }

    expect(metadata).toHaveProperty('format');
    expect(metadata).toHaveProperty('valid');
    expect(metadata).toHaveProperty('transferSyntax');
  });
});
