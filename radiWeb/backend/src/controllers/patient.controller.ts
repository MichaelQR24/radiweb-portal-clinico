import { Request, Response } from 'express';
import { getPool } from '../config/db.config';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { logAction } from '../services/audit.service';
import { CreatePatientDto, UpdatePatientDto } from '../models/patient.model';
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '../utils/constants';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

import { localDb } from '../utils/localDb';
import { encrypt, decrypt } from '../utils/encryption.util';
import { logger } from '../utils/logger';

/**
 * Descifra los campos sensibles de una fila de la BD antes de enviarla al frontend.
 * El frontend no nota ningún cambio: siempre recibe datos en texto claro.
 */
function decryptPatient(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    full_name: decrypt(row['full_name'] as string),
    dni:       decrypt(row['dni'] as string),
  };
}

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

    // Obtener todos los pacientes y desencriptar en memoria para poder buscar
    const [allRows] = await pool.query<RowDataPacket[]>(`
      SELECT p.*, u.name as created_by_name
      FROM Patients p
      LEFT JOIN Users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `);

    let decryptedPatients = (allRows as Record<string, unknown>[]).map(decryptPatient);

    if (search) {
      const searchLower = search.toLowerCase();
      decryptedPatients = decryptedPatients.filter(p => 
        (p['full_name'] as string).toLowerCase().includes(searchLower) ||
        (p['dni'] as string).includes(searchLower)
      );
    }

    const total = decryptedPatients.length;
    const paginatedRecords = decryptedPatients.slice(offset, offset + limit);

    sendSuccess(res, {
      records: paginatedRecords,
      total: total,
      page, limit,
    }, 'Pacientes obtenidos');
  } catch (error) {
    logger.error('Error en getPatients:', error);
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
    sendSuccess(res, decryptPatient(rows[0] as Record<string, unknown>), 'Paciente obtenido');
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

    // Verificar DNI duplicado (desencriptando en memoria)
    const [allPatients] = await pool.execute<RowDataPacket[]>('SELECT id, dni FROM Patients');
    const isDuplicate = allPatients.some(p => {
      try {
        return decrypt(p['dni']) === dto.dni;
      } catch {
        return false;
      }
    });

    if (isDuplicate) {
      sendError(res, 'Ya existe un paciente con ese número de DNI', 409);
      return;
    }

    // Cifrar campos sensibles antes de persistir en MySQL
    const [result] = await pool.execute<ResultSetHeader>(`
      INSERT INTO Patients (full_name, dni, age, gender, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [encrypt(dto.full_name), encrypt(dto.dni), dto.age, dto.gender, userId]);

    const [patientRows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM Patients WHERE id = ?',
      [result.insertId]
    );

    const patient = decryptPatient(patientRows[0] as Record<string, unknown>);
    await logAction(userId, 'CREATE_PATIENT', 'Patient', (patient as { id: number }).id, req.ip ?? '');
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

    // Cifrar full_name si se actualiza
    const encryptedName = dto.full_name ? encrypt(dto.full_name) : null;

    const [result] = await pool.execute<ResultSetHeader>(`
      UPDATE Patients
      SET
        full_name = COALESCE(?, full_name),
        age       = COALESCE(?, age),
        gender    = COALESCE(?, gender)
      WHERE id = ?
    `, [encryptedName, dto.age ?? null, dto.gender ?? null, id]);

    if (result.affectedRows === 0) { sendError(res, 'Paciente no encontrado', 404); return; }

    const [patientRows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM Patients WHERE id = ?',
      [id]
    );

    await logAction(userId, 'UPDATE_PATIENT', 'Patient', id, req.ip ?? '');
    sendSuccess(res, decryptPatient(patientRows[0] as Record<string, unknown>), 'Paciente actualizado');
  } catch {
    sendError(res, 'Error actualizando paciente', 500);
  }
}
