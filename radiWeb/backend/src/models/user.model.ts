export type UserRole = 'tecnologo' | 'radiologo' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  last_login: Date | null;
}

export interface UserPublic {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  last_login: Date | null;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: UserRole;
}
