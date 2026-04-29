import { Request, Response } from 'express';
import { getPool } from '../config/db.config';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { logAction } from '../services/audit.service';
import { uploadBlob } from '../services/azureBlob.service';
import { isValidDicom } from '../services/dicom.service';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const CONTAINER_DICOM = process.env['AZURE_STORAGE_CONTAINER_DICOM'] ?? 'dicom-images';
import { localDb } from '../utils/localDb';

/**
 * POST /api/images/upload
 * Sube imagen(es) DICOM o PNG/JPG a Azure Blob Storage.
 * Solo tecnólogo médico.
 */
export async function uploadImages(req: Request, res: Response): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      sendError(res, 'No se recibieron archivos para subir', 400);
      return;
    }

    const studyId = parseInt(req.body['study_id'] as string ?? '0', 10);
    if (!studyId) { sendError(res, 'El ID del estudio es requerido', 400); return; }

    const userId = req.user!.userId;
    const pool = await getPool();
    const uploadedImages = [];

    for (const file of files) {
      const isDicom = isValidDicom(file.buffer) || file.originalname.match(/\.(dcm|dicom)$/i);
      const format = isDicom ? 'DICOM' : (file.mimetype === 'image/png' ? 'PNG' : 'JPG');
      const fileSizeKb = Math.round(file.size / 1024);

      const blobResult = await uploadBlob(CONTAINER_DICOM, file, `study-${studyId}/`);

      if (!pool) {
        const imagesDb = localDb.images;
        if (!imagesDb[studyId]) imagesDb[studyId] = [];
        const newImg = { id: Date.now(), study_id: studyId, original_filename: file.originalname, blob_url: blobResult.blobUrl, preview_url: blobResult.sasUrl, format, file_size_kb: fileSizeKb, quality_approved: false, uploaded_at: new Date() };
        imagesDb[studyId].push(newImg);
        localDb.images = imagesDb;
        uploadedImages.push(newImg);
        continue;
      }

      const [result] = await pool.execute<ResultSetHeader>(`
          INSERT INTO Images (study_id, original_filename, blob_url, preview_url, format, file_size_kb, quality_approved, uploaded_by, uploaded_at)
          VALUES (?, ?, ?, ?, ?, ?, 0, ?, NOW())
        `, [studyId, file.originalname, blobResult.blobUrl, blobResult.sasUrl ?? null, format, fileSizeKb, userId]);

      const [imgRows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM Images WHERE id = ?',
        [result.insertId]
      );

      uploadedImages.push(imgRows[0]);
    }

    await logAction(userId, 'UPLOAD_IMAGES', 'Study', studyId, req.ip ?? '');
    sendSuccess(res, uploadedImages, `${uploadedImages.length} imagen(es) subida(s) exitosamente`, 201);
  } catch (error) {
    sendError(res, `Error subiendo imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`, 500);
  }
}

/**
 * GET /api/images/:studyId
 * Obtiene las imágenes asociadas a un estudio.
 */
export async function getImagesByStudy(req: Request, res: Response): Promise<void> {
  try {
    const studyId = parseInt(req.params['studyId'] ?? '0', 10);
    const pool = await getPool();

    if (!pool) {
      sendSuccess(res, localDb.images[studyId] ?? [], 'Imágenes obtenidas');
      return;
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM Images WHERE study_id = ? ORDER BY uploaded_at ASC',
      [studyId]
    );

    sendSuccess(res, rows, 'Imágenes obtenidas');
  } catch {
    sendError(res, 'Error obteniendo imágenes', 500);
  }
}

/**
 * DELETE /api/images/:id
 * Elimina una imagen. Solo administrador.
 */
export async function deleteImage(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] ?? '0', 10);
    const userId = req.user!.userId;
    const pool = await getPool();

    if (!pool) {
      sendSuccess(res, null, 'Imagen eliminada (mock)');
      return;
    }

    const [imgRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM Images WHERE id = ?',
      [id]
    );
    
    if (imgRows.length === 0) { sendError(res, 'Imagen no encontrada', 404); return; }

    await pool.execute('DELETE FROM Images WHERE id = ?', [id]);

    await logAction(userId, 'DELETE_IMAGE', 'Image', id, req.ip ?? '');
    sendSuccess(res, null, 'Imagen eliminada exitosamente');
  } catch {
    sendError(res, 'Error eliminando imagen', 500);
  }
}
