import { Request, Response } from 'express';
import { getPool } from '../config/db.config';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { logAction } from '../services/audit.service';
import { CreatePatientDto, UpdatePatientDto } from '../models/patient.model';
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '../utils/constants';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

import { localDb } from '../utils/localDb';

/**
 * GET /api/patients
 * Lista pacientes con paginación y búsqueda opcional.
 */
export async function getPatients(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query['page'] as string ?? `${DEFAULT_PAGE}`, 10);
    const limit = parseInt(req.query['limit'] as string ?? `${DEFAULT_LIMIT}`, 10);
    const search = (req.query['search'] as string ?? '').trim();
    const pool = await getPool();

    if (!pool) {
      let filtered = localDb.patients;
      if (search) {
        filtered = filtered.filter(p =>
          p.full_name.toLowerCase().includes(search.toLowerCase()) ||
          p.dni.includes(search)
        );
      }
      const start = (page - 1) * limit;
      sendSuccess(res, {
        records: filtered.slice(start, start + limit),
        total: filtered.length, page, limit,
      }, 'Pacientes obtenidos');
      return;
    }

    const offset = (page - 1) * limit;
    const searchTerm = `%${search}%`;

    const [rows] = await pool.query<RowDataPacket[][]>(`
      SELECT p.*, u.name as created_by_name
      FROM Patients p
      LEFT JOIN Users u ON p.created_by = u.id
      WHERE (? = '%%' OR p.full_name LIKE ? OR p.dni LIKE ?)
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?;

      SELECT COUNT(*) as total FROM Patients
      WHERE (? = '%%' OR full_name LIKE ? OR dni LIKE ?);
    `, [searchTerm, searchTerm, searchTerm, limit, offset, searchTerm, searchTerm, searchTerm]);

    sendSuccess(res, {
      records: rows[0],
      total: rows[1][0]?.total ?? 0,
      page, limit,
    }, 'Pacientes obtenidos');
  } catch (error) {
    console.error(error);
    sendError(res, 'Error obteniendo pacientes', 500);
  }
}

/**
 * GET /api/patients/:id
 * Obtiene un paciente por ID.
 */
export async function getPatientById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] ?? '0', 10);
    const pool = await getPool();

    if (!pool) {
      const patient = localDb.patients.find(p => p.id === id);
      if (!patient) { sendError(res, 'Paciente no encontrado', 404); return; }
      sendSuccess(res, patient, 'Paciente obtenido');
      return;
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM Patients WHERE id = ?',
      [id]
    );

    if (rows.length === 0) { sendError(res, 'Paciente no encontrado', 404); return; }
    sendSuccess(res, rows[0], 'Paciente obtenido');
  } catch {
    sendError(res, 'Error obteniendo paciente', 500);
  }
}

/**
 * POST /api/patients
 * Crea un nuevo paciente. Solo tecnólogo.
 */
export async function createPatient(req: Request, res: Response): Promise<void> {
  try {
    const dto = req.body as CreatePatientDto;
    const userId = req.user!.userId;
    const pool = await getPool();

    if (!pool) {
      const patients = localDb.patients;
      const newPatient = { id: patients.length + 1, ...dto, created_at: new Date(), created_by: userId };
      patients.push(newPatient);
      localDb.patients = patients;
      sendSuccess(res, newPatient, 'Paciente creado exitosamente', 201);
      return;
    }

    // Verificar DNI duplicado
    const [checkRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM Patients WHERE dni = ?',
      [dto.dni]
    );

    if (checkRows.length > 0) {
      sendError(res, 'Ya existe un paciente con ese número de DNI', 409);
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(`
      INSERT INTO Patients (full_name, dni, age, gender, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [dto.full_name, dto.dni, dto.age, dto.gender, userId]);

    const [patientRows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM Patients WHERE id = ?',
      [result.insertId]
    );

    const patient = patientRows[0];
    await logAction(userId, 'CREATE_PATIENT', 'Patient', patient.id, req.ip ?? '');
    sendSuccess(res, patient, 'Paciente creado exitosamente', 201);
  } catch {
    sendError(res, 'Error creando paciente', 500);
  }
}

/**
 * PUT /api/patients/:id
 * Actualiza un paciente existente.
 */
export async function updatePatient(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] ?? '0', 10);
    const dto = req.body as UpdatePatientDto;
    const userId = req.user!.userId;
    const pool = await getPool();

    if (!pool) {
      const patients = localDb.patients;
      const idx = patients.findIndex(p => p.id === id);
      if (idx === -1) { sendError(res, 'Paciente no encontrado', 404); return; }
      Object.assign(patients[idx], dto);
      localDb.patients = patients;
      sendSuccess(res, patients[idx], 'Paciente actualizado');
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(`
      UPDATE Patients
      SET
        full_name = COALESCE(?, full_name),
        age = COALESCE(?, age),
        gender = COALESCE(?, gender)
      WHERE id = ?
    `, [dto.full_name ?? null, dto.age ?? null, dto.gender ?? null, id]);

    if (result.affectedRows === 0) { sendError(res, 'Paciente no encontrado', 404); return; }

    const [patientRows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM Patients WHERE id = ?',
      [id]
    );

    await logAction(userId, 'UPDATE_PATIENT', 'Patient', id, req.ip ?? '');
    sendSuccess(res, patientRows[0], 'Paciente actualizado');
  } catch {
    sendError(res, 'Error actualizando paciente', 500);
  }
}
