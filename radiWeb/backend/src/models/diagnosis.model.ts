export interface Diagnosis {
  id: number;
  study_id: number;
  report_text: string;
  conclusion: string;
  radiologist_id: number;
  created_at: Date;
  // Campos JOIN opcionales
  radiologist_name?: string;
}

export interface CreateDiagnosisDto {
  study_id: number;
  report_text: string;
  conclusion: string;
}

export interface UpdateDiagnosisDto {
  report_text?: string;
  conclusion?: string;
}
