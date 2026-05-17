import { Request, Response } from 'express';
import { getPool } from '../config/db.config';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { logAction } from '../services/audit.service';
import { CreateDiagnosisDto, UpdateDiagnosisDto } from '../models/diagnosis.model';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

import { localDb } from '../utils/localDb';
import { createNotification } from '../services/notification.service';

/**
 * POST /api/diagnoses
 * Crea un nuevo diagnóstico para un estudio. Solo radiólogo.
 */
export async function createDiagnosis(req: Request, res: Response): Promise<void> {
  try {
    const dto = req.body as CreateDiagnosisDto;
    const userId = req.user!.userId;
    const pool = await getPool();

    if (!pool) {
      const diagnosesDb = localDb.diagnoses;
      const newDiag = { id: Date.now(), ...dto, radiologist_id: userId, created_at: new Date(), radiologist_name: 'Radiólogo Demo' };
      diagnosesDb[dto.study_id] = newDiag;
      localDb.diagnoses = diagnosesDb;
      
      const studies = localDb.studies;
      const study = studies.find(s => s.id === dto.study_id);
      if (study) {
        study.status = 'diagnosticado';
        localDb.studies = studies;
      }
      
      sendSuccess(res, newDiag, 'Diagnóstico creado exitosamente', 201);
      return;
    }

    // Verificar que el estudio no tenga ya un diagnóstico
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM Diagnoses WHERE study_id = ?',
      [dto.study_id]
    );

    if (existing.length > 0) {
      sendError(res, 'Este estudio ya tiene un diagnóstico. Use PUT para actualizarlo.', 409);
      return;
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute<ResultSetHeader>(`
        INSERT INTO Diagnoses (study_id, report_text, conclusion, radiologist_id, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [dto.study_id, dto.report_text, dto.conclusion, userId]);

      await connection.execute(`
        UPDATE Studies SET status = 'diagnosticado', updated_at = NOW()
        WHERE id = ?
      `, [dto.study_id]);

      await connection.commit();

      // Notificar al tecnólogo que creó el estudio
      const [studyInfo] = await pool.execute<RowDataPacket[]>(
        'SELECT created_by FROM Studies WHERE id = ?',
        [dto.study_id]
      );
      if (studyInfo.length > 0) {
        await createNotification(
          studyInfo[0].created_by,
          `El diagnóstico del estudio #${dto.study_id} ya está disponible.`
        );
      }

      const [diagRows] = await pool.execute<RowDataPacket[]>(
          'SELECT * FROM Diagnoses WHERE id = ?',
          [result.insertId]
      );

      const diagnosis = diagRows[0];
      await logAction(userId, 'CREATE_DIAGNOSIS', 'Study', dto.study_id, req.ip ?? '');
      sendSuccess(res, diagnosis, 'Diagnóstico creado y estudio marcado como diagnosticado', 201);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    sendError(res, 'Error creando diagnóstico', 500);
  }
}

/**
 * GET /api/diagnoses/:studyId
 * Obtiene el diagnóstico de un estudio.
 */
export async function getDiagnosisByStudy(req: Request, res: Response): Promise<void> {
  try {
    const studyId = parseInt(req.params['studyId'] ?? '0', 10);
    const pool = await getPool();

    if (!pool) {
      const diag = localDb.diagnoses[studyId];
      if (!diag) { sendError(res, 'No se encontró diagnóstico para este estudio', 404); return; }
      sendSuccess(res, diag, 'Diagnóstico obtenido');
      return;
    }

    const [rows] = await pool.execute<RowDataPacket[]>(`
        SELECT d.*, u.name as radiologist_name
        FROM Diagnoses d
        LEFT JOIN Users u ON d.radiologist_id = u.id
        WHERE d.study_id = ?
      `, [studyId]);

    if (rows.length === 0) { sendError(res, 'No se encontró diagnóstico para este estudio', 404); return; }
    sendSuccess(res, rows[0], 'Diagnóstico obtenido');
  } catch {
    sendError(res, 'Error obteniendo diagnóstico', 500);
  }
}

/**
 * PUT /api/diagnoses/:id
 * Actualiza un diagnóstico existente. Solo radiólogo.
 */
export async function updateDiagnosis(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] ?? '0', 10);
    const dto = req.body as UpdateDiagnosisDto;
    const userId = req.user!.userId;
    const pool = await getPool();

    if (!pool) {
      sendSuccess(res, { id, ...dto }, 'Diagnóstico actualizado (mock)');
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(`
        UPDATE Diagnoses
        SET
          report_text = COALESCE(?, report_text),
          conclusion = COALESCE(?, conclusion)
        WHERE id = ? AND radiologist_id = ?
      `, [dto.report_text ?? null, dto.conclusion ?? null, id, userId]);

    if (result.affectedRows === 0) { sendError(res, 'Diagnóstico no encontrado o sin permisos para editarlo', 404); return; }

    const [diagRows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM Diagnoses WHERE id = ?',
        [id]
    );

    await logAction(userId, 'UPDATE_DIAGNOSIS', 'Diagnosis', id, req.ip ?? '');
    sendSuccess(res, diagRows[0], 'Diagnóstico actualizado');
  } catch {
    sendError(res, 'Error actualizando diagnóstico', 500);
  }
}
