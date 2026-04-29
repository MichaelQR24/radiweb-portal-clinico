export type UserRole = 'tecnologo' | 'radiologo' | 'admin';
export type StudyStatus = 'pendiente' | 'enviado' | 'diagnosticado' | 'rechazado';
export type Gender = 'M' | 'F' | 'O';
export type ImageFormat = 'DICOM' | 'PNG' | 'JPG';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: unknown[];
}

export interface PaginatedResponse<T> {
  records: T[];
  total: number;
  page: number;
  limit: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface Patient {
  id: number;
  full_name: string;
  dni: string;
  age: number;
  gender: Gender;
  created_at: string;
  created_by: number;
  created_by_name?: string;
}

export interface Study {
  id: number;
  patient_id: number;
  study_type: string;
  body_area: string;
  referring_doctor: string;
  clinical_notes: string;
  status: StudyStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  patient_dni?: string;
  patient_age?: number;
  patient_gender?: Gender;
  created_by_name?: string;
}

export interface StudyStats {
  today: number;
  pending: number;
  sent: number;
  rejected: number;
  diagnosed: number;
}

export interface Image {
  id: number;
  study_id: number;
  original_filename: string;
  blob_url: string;
  preview_url: string | null;
  format: ImageFormat;
  resolution: string | null;
  file_size_kb: number;
  quality_approved: boolean;
  uploaded_at: string;
  uploaded_by: number;
}

export interface Diagnosis {
  id: number;
  study_id: number;
  report_text: string;
  conclusion: string;
  radiologist_id: number;
  created_at: string;
  radiologist_name?: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity: string;
  entity_id: number | null;
  ip_address: string;
  timestamp: string;
  user_name?: string;
  user_email?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface CreatePatientDto {
  full_name: string;
  dni: string;
  age: number;
  gender: Gender;
}

export interface CreateStudyDto {
  patient_id: number;
  study_type: string;
  body_area: string;
  referring_doctor: string;
  clinical_notes?: string;
}

export interface CreateDiagnosisDto {
  study_id: number;
  report_text: string;
  conclusion: string;
}
