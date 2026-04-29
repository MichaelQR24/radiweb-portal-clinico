import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getPool } from '../config/db.config';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../config/jwt.config';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { logAction } from '../services/audit.service';
import { UserPublic } from '../models/user.model';
import { RowDataPacket } from 'mysql2';

import { localDb } from '../utils/localDb';

/**
 * POST /api/auth/login
 * Autentica al usuario y devuelve un JWT de acceso.
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const pool = await getPool();

    let user: any = null;
    let passwordValid = false;

    if (!pool) {
      // Modo mock: aceptar cualquier contraseña para usuarios demo
      const usersDb = localDb.users;
      user = usersDb.find(u => u.email === email) ?? null;
      passwordValid = user !== null && password.length >= 6;
      if (passwordValid && user) {
        user.last_login = new Date();
        localDb.users = usersDb;
      }
    } else {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM Users WHERE email = ? AND is_active = 1',
        [email]
      );

      if (rows.length === 0) {
        sendError(res, 'Credenciales inválidas', 401);
        return;
      }

      user = rows[0];
      passwordValid = await bcrypt.compare(password, user.password_hash);

      if (passwordValid) {
        // Actualizar último acceso
        await pool.execute(
          'UPDATE Users SET last_login = NOW() WHERE id = ?',
          [user.id]
        );
      }
    }

    if (!user || !passwordValid) {
      sendError(res, 'Credenciales inválidas. Verifique su email y contraseña.', 401);
      return;
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Refresh token en cookie HttpOnly
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    await logAction(user.id, 'LOGIN', 'User', user.id, req.ip ?? '');

    const userPublic: UserPublic = {
      id: user.id, name: user.name, email: user.email,
      role: user.role, is_active: user.is_active,
      created_at: user.created_at, last_login: user.last_login,
    };

    sendSuccess(res, { user: userPublic, accessToken }, 'Autenticación exitosa');
  } catch (error) {
    sendError(res, 'Error durante la autenticación', 500);
  }
}

/**
 * POST /api/auth/logout
 * Invalida la sesión limpiando el refresh token cookie.
 */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    if (req.user) {
      await logAction(req.user.userId, 'LOGOUT', 'User', req.user.userId, req.ip ?? '');
    }
    res.clearCookie('refreshToken');
    sendSuccess(res, null, 'Sesión cerrada exitosamente');
  } catch {
    sendError(res, 'Error cerrando sesión', 500);
  }
}

/**
 * GET /api/auth/me
 * Retorna el perfil del usuario autenticado.
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { sendError(res, 'No autenticado', 401); return; }

    const pool = await getPool();

    if (!pool) {
      const user = localDb.users.find(u => u.id === userId);
      if (!user) { sendError(res, 'Usuario no encontrado', 404); return; }
      const { password_hash: _, ...userPublic } = user;
      sendSuccess(res, userPublic, 'Perfil obtenido');
      return;
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name, email, role, is_active, created_at, last_login FROM Users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) { sendError(res, 'Usuario no encontrado', 404); return; }
    sendSuccess(res, rows[0], 'Perfil obtenido');
  } catch {
    sendError(res, 'Error obteniendo perfil', 500);
  }
}

/**
 * POST /api/auth/refresh
 * Genera un nuevo access token a partir del refresh token en cookie.
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const token = req.cookies['refreshToken'] as string | undefined;
    if (!token) { sendError(res, 'Refresh token requerido', 401); return; }

    const payload = verifyRefreshToken(token);
    const newAccessToken = signAccessToken({
      userId: payload.userId, email: payload.email, role: payload.role,
    });

    sendSuccess(res, { accessToken: newAccessToken }, 'Token renovado exitosamente');
  } catch {
    sendError(res, 'Refresh token inválido o expirado', 401);
  }
}
