import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getPool } from '../config/db.config';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { logAction } from '../services/audit.service';
import { CreateUserDto, UpdateUserDto } from '../models/user.model';
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '../utils/constants';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

import { localDb } from '../utils/localDb';

/**
 * GET /api/users
 * Lista todos los usuarios. Solo administrador.
 */
export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query['page'] as string ?? `${DEFAULT_PAGE}`, 10);
    const limit = parseInt(req.query['limit'] as string ?? `${DEFAULT_LIMIT}`, 10);
    const search = (req.query['search'] as string ?? '').trim();
    const pool = await getPool();

    if (!pool) {
      let filtered = localDb.users;
      if (search) filtered = filtered.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.includes(search));
      const start = (page - 1) * limit;
      sendSuccess(res, { records: filtered.slice(start, start + limit), total: filtered.length, page, limit }, 'Usuarios obtenidos');
      return;
    }

    const offset = (page - 1) * limit;
    const searchTerm = `%${search}%`;

    const [rows] = await pool.query<RowDataPacket[][]>(`
        SELECT id, name, email, role, is_active, created_at, last_login
        FROM Users
        WHERE (? = '%%' OR name LIKE ? OR email LIKE ?)
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?;

        SELECT COUNT(*) as total FROM Users WHERE (? = '%%' OR name LIKE ? OR email LIKE ?);
      `, [searchTerm, searchTerm, searchTerm, limit, offset, searchTerm, searchTerm, searchTerm]);

    sendSuccess(res, {
      records: rows[0],
      total: rows[1][0]?.total ?? 0,
      page, limit,
    }, 'Usuarios obtenidos');
  } catch (error) {
    console.error(error);
    sendError(res, 'Error obteniendo usuarios', 500);
  }
}

/**
 * POST /api/users
 * Crea un nuevo usuario del sistema. Solo administrador.
 */
export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const dto = req.body as CreateUserDto;
    const adminId = req.user!.userId;
    const pool = await getPool();

    const passwordHash = await bcrypt.hash(dto.password, 12);

    if (!pool) {
      const usersDb = localDb.users;
      const newUser = { id: usersDb.length + 1, name: dto.name, email: dto.email, role: dto.role, is_active: true, created_at: new Date(), last_login: null };
      usersDb.push(newUser);
      localDb.users = usersDb;
      sendSuccess(res, newUser, 'Usuario creado exitosamente', 201);
      return;
    }

    // Verificar email duplicado
    const [checkRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM Users WHERE email = ?',
      [dto.email]
    );

    if (checkRows.length > 0) {
      sendError(res, 'Ya existe un usuario con ese email', 409);
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(`
        INSERT INTO Users (name, email, password_hash, role, is_active, created_at)
        VALUES (?, ?, ?, ?, 1, NOW())
      `, [dto.name, dto.email, passwordHash, dto.role]);

    const [userRows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, name, email, role, is_active, created_at FROM Users WHERE id = ?',
        [result.insertId]
    );

    const user = userRows[0];
    await logAction(adminId, 'CREATE_USER', 'User', user.id, req.ip ?? '');
    sendSuccess(res, user, 'Usuario creado exitosamente', 201);
  } catch {
    sendError(res, 'Error creando usuario', 500);
  }
}

/**
 * PUT /api/users/:id
 * Actualiza datos de un usuario. Solo administrador.
 */
export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] ?? '0', 10);
    const dto = req.body as UpdateUserDto;
    const adminId = req.user!.userId;
    const pool = await getPool();

    if (!pool) {
      const usersDb = localDb.users;
      const user = usersDb.find(u => u.id === id);
      if (!user) { sendError(res, 'Usuario no encontrado', 404); return; }
      Object.assign(user, dto);
      localDb.users = usersDb;
      sendSuccess(res, user, 'Usuario actualizado');
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(`
        UPDATE Users
        SET
          name = COALESCE(?, name),
          email = COALESCE(?, email),
          role = COALESCE(?, role)
        WHERE id = ?
      `, [dto.name ?? null, dto.email ?? null, dto.role ?? null, id]);

    if (result.affectedRows === 0) { sendError(res, 'Usuario no encontrado', 404); return; }

    const [userRows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, name, email, role, is_active, created_at, last_login FROM Users WHERE id = ?',
        [id]
    );

    await logAction(adminId, 'UPDATE_USER', 'User', id, req.ip ?? '');
    sendSuccess(res, userRows[0], 'Usuario actualizado');
  } catch {
    sendError(res, 'Error actualizando usuario', 500);
  }
}

/**
 * PATCH /api/users/:id/toggle
 * Activa o desactiva un usuario. Solo administrador.
 */
export async function toggleUserStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] ?? '0', 10);
    const adminId = req.user!.userId;

    if (id === adminId) {
      sendError(res, 'No puede desactivar su propia cuenta', 400);
      return;
    }

    const pool = await getPool();

    if (!pool) {
      const usersDb = localDb.users;
      const user = usersDb.find(u => u.id === id);
      if (!user) { sendError(res, 'Usuario no encontrado', 404); return; }
      user.is_active = !user.is_active;
      localDb.users = usersDb;
      sendSuccess(res, user, `Usuario ${user.is_active ? 'activado' : 'desactivado'}`);
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(`
        UPDATE Users
        SET is_active = IF(is_active = 1, 0, 1)
        WHERE id = ?
      `, [id]);

    if (result.affectedRows === 0) { sendError(res, 'Usuario no encontrado', 404); return; }
    
    const [userRows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, name, is_active FROM Users WHERE id = ?',
        [id]
    );

    const updated = userRows[0] as { id: number; name: string; is_active: boolean };
    await logAction(adminId, updated.is_active ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', 'User', id, req.ip ?? '');
    sendSuccess(res, updated, `Usuario ${updated.is_active ? 'activado' : 'desactivado'} exitosamente`);
  } catch {
    sendError(res, 'Error actualizando estado del usuario', 500);
  }
}
