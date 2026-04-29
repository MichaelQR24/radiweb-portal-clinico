export type Gender = 'M' | 'F' | 'O';

export interface Patient {
  id: number;
  full_name: string;
  dni: string;
  age: number;
  gender: Gender;
  created_at: Date;
  created_by: number;
}

export interface CreatePatientDto {
  full_name: string;
  dni: string;
  age: number;
  gender: Gender;
}

export interface UpdatePatientDto {
  full_name?: string;
  age?: number;
  gender?: Gender;
}
