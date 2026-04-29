import { Request, Response } from 'express';
import { getPool } from '../config/db.config';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { logAction } from '../services/audit.service';
import { CreateStudyDto, StudyStats } from '../models/study.model';
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '../utils/constants';
import { localDb } from '../utils/localDb';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * GET /api/studies
 * Lista estudios filtrados por rol del usuario.
 */
export async function getStudies(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query['page'] as string ?? `${DEFAULT_PAGE}`, 10);
    const limit = parseInt(req.query['limit'] as string ?? `${DEFAULT_LIMIT}`, 10);
    const status = req.query['status'] as string | undefined;
    const pool = await getPool();

    if (!pool) {
      let filtered = localDb.studies;
      if (status) filtered = filtered.filter(s => s.status === status);
      const start = (page - 1) * limit;
      sendSuccess(res, { records: filtered.slice(start, start + limit), total: filtered.length, page, limit }, 'Estudios obtenidos');
      return;
    }

    const offset = (page - 1) * limit;
    
    const [rows] = await pool.query<RowDataPacket[][]>(`
      SELECT s.*, p.full_name as patient_name, p.dni as patient_dni, u.name as created_by_name
      FROM Studies s
      LEFT JOIN Patients p ON s.patient_id = p.id
      LEFT JOIN Users u ON s.created_by = u.id
      WHERE (? IS NULL OR s.status = ?)
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?;

      SELECT COUNT(*) as total FROM Studies WHERE (? IS NULL OR status = ?);
    `, [status, status, limit, offset, status, status]);

    sendSuccess(res, {
      records: rows[0],
      total: rows[1][0]?.total ?? 0,
      page, limit,
    }, 'Estudios obtenidos');
  } catch (error) {
    console.error(error);
    sendError(res, 'Error obteniendo estudios', 500);
  }
}

/**
 * GET /api/studies/stats/today
 * Estadísticas del dashboard para el día actual.
 */
export async function getStudyStats(req: Request, res: Response): Promise<void> {
  try {
    const pool = await getPool();

    if (!pool) {
      const stats: StudyStats = { today: 3, pending: 1, sent: 1, rejected: 0, diagnosed: 1 };
      sendSuccess(res, stats, 'Estadísticas obtenidas');
      return;
    }

    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT
        COUNT(*) as today,
        SUM(CASE WHEN status = 'pendiente' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'enviado' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'rechazado' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'diagnosticado' THEN 1 ELSE 0 END) as diagnosed
      FROM Studies
    `);

    sendSuccess(res, rows[0], 'Estadísticas obtenidas');
  } catch {
    sendError(res, 'Error obteniendo estadísticas', 500);
  }
}

/**
 * GET /api/studies/:id
 * Obtiene detalle de un estudio por ID.
 */
export async function getStudyById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] ?? '0', 10);
    const pool = await getPool();

    if (!pool) {
      const study = localDb.studies.find(s => s.id === id);
      if (!study) { sendError(res, 'Estudio no encontrado', 404); return; }
      sendSuccess(res, study, 'Estudio obtenido');
      return;
    }

    const [rows] = await pool.execute<RowDataPacket[]>(`
        SELECT s.*, p.full_name as patient_name, p.dni as patient_dni, p.age as patient_age, p.gender as patient_gender,
               u.name as created_by_name
        FROM Studies s
        LEFT JOIN Patients p ON s.patient_id = p.id
        LEFT JOIN Users u ON s.created_by = u.id
        WHERE s.id = ?
      `, [id]);

    if (rows.length === 0) { sendError(res, 'Estudio no encontrado', 404); return; }
    sendSuccess(res, rows[0], 'Estudio obtenido');
  } catch {
    sendError(res, 'Error obteniendo estudio', 500);
  }
}

/**
 * POST /api/studies
 * Crea un nuevo estudio. Solo tecnólogo.
 */
export async function createStudy(req: Request, res: Response): Promise<void> {
  try {
    const dto = req.body as CreateStudyDto;
    const userId = req.user!.userId;
    const pool = await getPool();

    if (!pool) {
      const mockPatient = localDb.patients.find(p => p.id === dto.patient_id);
      const patientName = mockPatient ? mockPatient.full_name : `Paciente #${dto.patient_id}`;
      const studies = localDb.studies;
      const newStudy = { id: studies.length + 1, ...dto, clinical_notes: dto.clinical_notes ?? '', status: 'pendiente' as const, created_by: userId, created_at: new Date(), updated_at: new Date(), patient_name: patientName, patient_dni: '' };
      studies.push(newStudy);
      localDb.studies = studies;
      sendSuccess(res, newStudy, 'Estudio creado exitosamente', 201);
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(`
        INSERT INTO Studies (patient_id, study_type, body_area, referring_doctor, clinical_notes, status, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'pendiente', ?, NOW(), NOW())
      `, [dto.patient_id, dto.study_type, dto.body_area, dto.referring_doctor, dto.clinical_notes ?? '', userId]);

    const [studyRows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM Studies WHERE id = ?',
        [result.insertId]
    );

    const study = studyRows[0];
    await logAction(userId, 'CREATE_STUDY', 'Study', study.id, req.ip ?? '');
    sendSuccess(res, study, 'Estudio creado exitosamente', 201);
  } catch {
    sendError(res, 'Error creando estudio', 500);
  }
}

/**
 * PATCH /api/studies/:id/status
 * Actualiza el estado de un estudio.
 */
export async function updateStudyStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] ?? '0', 10);
    const { status } = req.body as { status: string };
    const userId = req.user!.userId;
    const pool = await getPool();

    if (!pool) {
      const studies = localDb.studies;
      const study = studies.find(s => s.id === id);
      if (!study) { sendError(res, 'Estudio no encontrado', 404); return; }
      (study as unknown as Record<string, unknown>)['status'] = status;
      localDb.studies = studies;
      sendSuccess(res, study, 'Estado actualizado');
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(`
        UPDATE Studies SET status = ?, updated_at = NOW()
        WHERE id = ?
      `, [status, id]);

    if (result.affectedRows === 0) { sendError(res, 'Estudio no encontrado', 404); return; }

    const [studyRows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM Studies WHERE id = ?',
        [id]
    );
    
    await logAction(userId, `UPDATE_STUDY_STATUS_${status.toUpperCase()}`, 'Study', id, req.ip ?? '');
    sendSuccess(res, studyRows[0], 'Estado actualizado');
  } catch {
    sendError(res, 'Error actualizando estado del estudio', 500);
  }
}

/**
 * PUT /api/studies/:id
 * Actualiza los datos clínicos de un estudio. Solo tecnólogo y admin.
 */
export async function updateStudy(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] ?? '0', 10);
    const dto = req.body as Partial<CreateStudyDto>;
    const userId = req.user!.userId;
    const pool = await getPool();

    if (!pool) {
      const studies = localDb.studies;
      const study = studies.find(s => s.id === id);
      if (!study) { sendError(res, 'Estudio no encontrado', 404); return; }
      
      if (dto.study_type) study.study_type = dto.study_type;
      if (dto.body_area) study.body_area = dto.body_area;
      if (dto.referring_doctor) study.referring_doctor = dto.referring_doctor;
      if (dto.clinical_notes !== undefined) study.clinical_notes = dto.clinical_notes;
      study.updated_at = new Date();
      
      localDb.studies = studies;
      sendSuccess(res, study, 'Estudio actualizado');
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(`
        UPDATE Studies 
        SET 
          study_type = COALESCE(?, study_type),
          body_area = COALESCE(?, body_area),
          referring_doctor = COALESCE(?, referring_doctor),
          clinical_notes = COALESCE(?, clinical_notes),
          updated_at = NOW()
        WHERE id = ?
      `, [dto.study_type ?? null, dto.body_area ?? null, dto.referring_doctor ?? null, dto.clinical_notes ?? null, id]);

    if (result.affectedRows === 0) { sendError(res, 'Estudio no encontrado', 404); return; }
    
    const [studyRows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM Studies WHERE id = ?',
        [id]
    );

    await logAction(userId, 'UPDATE_STUDY', 'Study', id, req.ip ?? '');
    sendSuccess(res, studyRows[0], 'Estudio actualizado exitosamente');
  } catch {
    sendError(res, 'Error actualizando estudio', 500);
  }
}

/**
 * DELETE /api/studies/:id
 * Elimina un estudio. Los tecnólogos solo pueden eliminar si está "pendiente". Los admin pueden eliminar cualquiera.
 */
export async function deleteStudy(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] ?? '0', 10);
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const pool = await getPool();

    if (!pool) {
      const studies = localDb.studies;
      const idx = studies.findIndex(s => s.id === id);
      if (idx === -1) { sendError(res, 'Estudio no encontrado', 404); return; }
      
      const study = studies[idx];
      if (userRole !== 'admin' && study.status !== 'pendiente') {
        sendError(res, 'No tiene permisos para eliminar un estudio que ya no está pendiente', 403);
        return;
      }
      
      studies.splice(idx, 1);
      localDb.studies = studies;
      sendSuccess(res, null, 'Estudio eliminado exitosamente');
      return;
    }

    // Check status first to enforce role restriction
    if (userRole !== 'admin') {
      const [checkRows] = await pool.execute<RowDataPacket[]>(
        'SELECT status FROM Studies WHERE id = ?',
        [id]
      );
        
      if (checkRows.length === 0) { sendError(res, 'Estudio no encontrado', 404); return; }
      if (checkRows[0].status !== 'pendiente') {
        sendError(res, 'No tiene permisos para eliminar un estudio que ya no está pendiente', 403);
        return;
      }
    }

    const [result] = await pool.execute<ResultSetHeader>(`
        DELETE FROM Studies
        WHERE id = ?
      `, [id]);

    if (result.affectedRows === 0) { sendError(res, 'Estudio no encontrado', 404); return; }
    await logAction(userId, 'DELETE_STUDY', 'Study', id, req.ip ?? '');
    sendSuccess(res, null, 'Estudio eliminado exitosamente');
  } catch {
    sendError(res, 'Error eliminando estudio', 500);
  }
}
