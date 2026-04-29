import jwt from 'jsonwebtoken';
import { UserRole } from '../models/user.model';

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'dev_secret_change_in_production_min_256_bits';
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] ?? '8h';
const JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] ?? 'dev_refresh_secret_change_in_production';
const JWT_REFRESH_EXPIRES_IN = process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d';

/**
 * Genera un token JWT de acceso para el usuario autenticado.
 */
export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

/**
 * Genera un refresh token de larga duración.
 */
export function signRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
}

/**
 * Verifica y decodifica un token de acceso.
 * Lanza error si el token es inválido o expiró.
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/**
 * Verifica y decodifica un refresh token.
 */
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
}
