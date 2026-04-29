import { logger } from '../utils/logger';

/**
 * Parsea metadatos básicos de un archivo DICOM.
 * En producción integrar con dcmjs o cornerstone-wado-image-loader.
 * Esta implementación extrae metadatos del buffer sin dependencias externas.
 */
export function parseDicomMetadata(buffer: Buffer): Record<string, string> {
  try {
    // Verificar el magic number de DICOM (bytes 128-131: "DICM")
    if (buffer.length < 132) {
      return { format: 'UNKNOWN', valid: 'false' };
    }

    const dicmMagic = buffer.toString('ascii', 128, 132);
    const isDicom = dicmMagic === 'DICM';

    if (!isDicom) {
      return { format: 'NON-DICOM', valid: 'false' };
    }

    // Metadatos básicos sin parseo completo (requeriría dcmjs en producción)
    return {
      format: 'DICOM',
      valid: 'true',
      transferSyntax: 'Implicitly detected',
    };
  } catch (error) {
    logger.error('Error parseando metadatos DICOM:', error);
    return { format: 'ERROR', valid: 'false' };
  }
}

/**
 * Verifica si un archivo es DICOM válido comprobando el header.
 */
export function isValidDicom(buffer: Buffer): boolean {
  if (buffer.length < 132) return false;
  const magic = buffer.toString('ascii', 128, 132);
  return magic === 'DICM';
}
