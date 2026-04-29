export type StudyStatus = 'pendiente' | 'enviado' | 'diagnosticado' | 'rechazado';

export interface Study {
  id: number;
  patient_id: number;
  study_type: string;
  body_area: string;
  referring_doctor: string;
  clinical_notes: string;
  status: StudyStatus;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  // Campos JOIN opcionales
  patient_name?: string;
  patient_dni?: string;
  created_by_name?: string;
}

export interface CreateStudyDto {
  patient_id: number;
  study_type: string;
  body_area: string;
  referring_doctor: string;
  clinical_notes?: string;
}

export interface UpdateStudyStatusDto {
  status: StudyStatus;
}

export interface StudyStats {
  today: number;
  pending: number;
  sent: number;
  rejected: number;
  diagnosed: number;
}
