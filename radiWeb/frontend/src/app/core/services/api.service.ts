import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, PaginatedResponse,
  Patient, Study, Image, Diagnosis, User, AuditLog,
  StudyStats, CreatePatientDto, CreateStudyDto, CreateDiagnosisDto,
  StudyStatus,
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  // ─── Pacientes ───────────────────────────────────────────────
  getPatients(page = 1, limit = 20, search = ''): Observable<ApiResponse<PaginatedResponse<Patient>>> {
    const params = new HttpParams().set('page', page).set('limit', limit).set('search', search);
    return this.http.get<ApiResponse<PaginatedResponse<Patient>>>(`${this.base}/patients`, { params });
  }

  getPatient(id: number): Observable<ApiResponse<Patient>> {
    return this.http.get<ApiResponse<Patient>>(`${this.base}/patients/${id}`);
  }

  createPatient(dto: CreatePatientDto): Observable<ApiResponse<Patient>> {
    return this.http.post<ApiResponse<Patient>>(`${this.base}/patients`, dto);
  }

  updatePatient(id: number, dto: Partial<CreatePatientDto>): Observable<ApiResponse<Patient>> {
    return this.http.put<ApiResponse<Patient>>(`${this.base}/patients/${id}`, dto);
  }

  // ─── Estudios ────────────────────────────────────────────────
  getStudies(page = 1, limit = 20, status?: StudyStatus): Observable<ApiResponse<PaginatedResponse<Study>>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<PaginatedResponse<Study>>>(`${this.base}/studies`, { params });
  }

  getStudy(id: number): Observable<ApiResponse<Study>> {
    return this.http.get<ApiResponse<Study>>(`${this.base}/studies/${id}`);
  }

  getStudyStats(): Observable<ApiResponse<StudyStats>> {
    return this.http.get<ApiResponse<StudyStats>>(`${this.base}/studies/stats/today`);
  }

  createStudy(dto: CreateStudyDto): Observable<ApiResponse<Study>> {
    return this.http.post<ApiResponse<Study>>(`${this.base}/studies`, dto);
  }

  updateStudyStatus(id: number, status: StudyStatus): Observable<ApiResponse<Study>> {
    return this.http.patch<ApiResponse<Study>>(`${this.base}/studies/${id}/status`, { status });
  }

  updateStudy(id: number, dto: Partial<CreateStudyDto>): Observable<ApiResponse<Study>> {
    return this.http.put<ApiResponse<Study>>(`${this.base}/studies/${id}`, dto);
  }

  deleteStudy(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/studies/${id}`);
  }

  // ─── Imágenes ────────────────────────────────────────────────
  uploadImages(studyId: number, files: File[]): Observable<ApiResponse<Image[]>> {
    const formData = new FormData();
    formData.append('study_id', studyId.toString());
    files.forEach(f => formData.append('files', f, f.name));
    return this.http.post<ApiResponse<Image[]>>(`${this.base}/images/upload`, formData);
  }

  getImages(studyId: number): Observable<ApiResponse<Image[]>> {
    return this.http.get<ApiResponse<Image[]>>(`${this.base}/images/${studyId}`);
  }

  deleteImage(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/images/${id}`);
  }

  // ─── Diagnósticos ────────────────────────────────────────────
  createDiagnosis(dto: CreateDiagnosisDto): Observable<ApiResponse<Diagnosis>> {
    return this.http.post<ApiResponse<Diagnosis>>(`${this.base}/diagnoses`, dto);
  }

  getDiagnosis(studyId: number): Observable<ApiResponse<Diagnosis>> {
    return this.http.get<ApiResponse<Diagnosis>>(`${this.base}/diagnoses/${studyId}`);
  }

  updateDiagnosis(id: number, dto: Partial<CreateDiagnosisDto>): Observable<ApiResponse<Diagnosis>> {
    return this.http.put<ApiResponse<Diagnosis>>(`${this.base}/diagnoses/${id}`, dto);
  }

  // ─── Usuarios ────────────────────────────────────────────────
  getUsers(page = 1, limit = 20, search = ''): Observable<ApiResponse<PaginatedResponse<User>>> {
    const params = new HttpParams().set('page', page).set('limit', limit).set('search', search);
    return this.http.get<ApiResponse<PaginatedResponse<User>>>(`${this.base}/users`, { params });
  }

  createUser(dto: { name: string; email: string; password: string; role: string }): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.base}/users`, dto);
  }

  updateUser(id: number, dto: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.base}/users/${id}`, dto);
  }

  toggleUser(id: number): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.base}/users/${id}/toggle`, {});
  }

  // ─── Auditoría ───────────────────────────────────────────────
  getAuditLogs(page = 1, limit = 20): Observable<ApiResponse<PaginatedResponse<AuditLog>>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<ApiResponse<PaginatedResponse<AuditLog>>>(`${this.base}/audit`, { params });
  }
}
