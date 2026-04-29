import { UserRole } from '../models/user.model';
import { StudyStatus } from '../models/study.model';

// Roles disponibles en el sistema
export const ROLES: Record<string, UserRole> = {
  TECNOLOGO: 'tecnologo',
  RADIOLOGO: 'radiologo',
  ADMIN: 'admin',
} as const;

// Estados posibles de un estudio
export const STUDY_STATUS: Record<string, StudyStatus> = {
  PENDIENTE: 'pendiente',
  ENVIADO: 'enviado',
  DIAGNOSTICADO: 'diagnosticado',
  RECHAZADO: 'rechazado',
} as const;

// Formatos de imagen aceptados
export const ALLOWED_IMAGE_FORMATS = ['DICOM', 'PNG', 'JPG', 'JPEG', 'DCM'] as const;
export const ALLOWED_MIME_TYPES = [
  'application/dicom',
  'image/png',
  'image/jpeg',
  'application/octet-stream', // archivos .dcm sin mime definido
] as const;

// Tamaño máximo de archivo: 100 MB
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

// Paginación por defecto
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// Tipos de estudio disponibles en DIRIS Lima Centro
export const STUDY_TYPES = [
  'Resonancia Magnética (MRI)',
  'Tomografía Computarizada (CT)',
  'Rayos X',
  'Ecografía',
  'Mamografía',
  'Densitometría Ósea',
  'Fluoroscopía',
  'Medicina Nuclear',
] as const;
