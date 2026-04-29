import multer from 'multer';
import { Request } from 'express';
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from '../utils/constants';

// Almacenamiento en memoria (los archivos se suben directamente a Azure Blob)
const storage = multer.memoryStorage();

/**
 * Filtro que acepta archivos DICOM, PNG y JPG.
 */
function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void {
  const allowedMimes = ALLOWED_MIME_TYPES as readonly string[];
  const allowedExtensions = /\.(dcm|dicom|png|jpg|jpeg)$/i;

  const mimeOk = allowedMimes.includes(file.mimetype);
  const extOk = allowedExtensions.test(file.originalname);

  if (mimeOk || extOk) {
    callback(null, true);
  } else {
    callback(
      new Error(
        'Formato de archivo no permitido. Solo se aceptan archivos DICOM (.dcm), PNG y JPG.'
      )
    );
  }
}

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 10, // Máximo 10 imágenes por estudio por solicitud
  },
});
