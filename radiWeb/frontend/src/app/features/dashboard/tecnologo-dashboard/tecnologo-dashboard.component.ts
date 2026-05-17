import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { StudyStats, Study, CreateStudyDto } from '../../../core/models/models';

@Component({
    selector: 'app-tecnologo-dashboard',
    imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule, SidebarComponent, NavbarComponent, StatusBadgeComponent],
    template: `
    <div class="rw-layout">
      <app-sidebar />

      <div class="rw-main">
        <app-navbar title="Resumen Tecnólogo" [(privacyMode)]="privacyMode" />

        <main class="rw-content">
          <!-- Header -->
          <div class="rw-page-header">
            <h1>Resumen de Actividad</h1>
            <p>Bienvenido, {{ auth.currentUser()?.name }}. Estado actual del centro de imagenología.</p>
          </div>

          <!-- Stats Cards -->
          <div class="stats-grid">
            @for (stat of statCards(); track stat.label; let i = $index) {
              <div class="rw-stat-card" [style.animation-delay]="(i * 0.08) + 's'" [id]="'stat-' + stat.key">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                  <span class="stat-label">{{ stat.label }}</span>
                  <mat-icon [style.color]="stat.iconColor">{{ stat.icon }}</mat-icon>
                </div>
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-bar">
                  <div class="stat-bar-fill" [class.error]="stat.isError" [style.width.%]="stat.progress"></div>
                </div>
              </div>
            }
          </div>

          <!-- Recent Studies Table -->
          <section class="rw-card" style="overflow:hidden;margin-top:32px">
            <div style="padding:16px 20px;border-bottom:1px solid var(--color-outline-variant);display:flex;justify-content:space-between;align-items:center;background:var(--color-surface-container-low)">
              <h2 style="font-size:16px;font-weight:700;color:var(--color-on-surface);margin:0;display:flex;align-items:center;gap:8px">
                <mat-icon style="color:var(--color-primary)">activity</mat-icon>
                Actividad Reciente
              </h2>
              <button routerLink="/studies/new" class="rw-btn rw-btn--primary" id="btn-new-study" style="padding:8px 16px;font-size:12px">
                <mat-icon>add</mat-icon>
                Nuevo Registro
              </button>
            </div>

            <div style="overflow-x:auto">
              <table class="rw-table">
                <thead>
                  <tr>
                    <th>ID Estudio</th>
                    <th>Paciente</th>
                    <th>Tipo</th>
                    <th>Área</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th style="text-align:right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @if (loading()) {
                    <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--color-on-surface-variant)">
                      <div class="rw-spinner" style="margin:0 auto"></div>
                    </td></tr>
                  }
                  @for (study of studies(); track study.id) {
                    <tr>
                      <td style="font-weight:700;font-size:12px;color:var(--color-on-surface-variant)">#{{ study.id }}</td>
                      <td>
                        <div class="privacy-cell" [class.blurred]="privacyMode" style="font-weight:600">{{ study.patient_name }}</div>
                        @if (study.patient_dni) {
                          <div class="privacy-cell" [class.blurred]="privacyMode" style="font-size:10px;opacity:.6">DNI: {{ study.patient_dni }}</div>
                        }
                      </td>
                      <td style="color:var(--color-on-surface-variant)">{{ study.study_type }}</td>
                      <td style="color:var(--color-on-surface-variant)">{{ study.body_area }}</td>
                      <td style="font-size:12px;color:var(--color-on-surface-variant)">{{ study.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
                      <td><app-status-badge [status]="study.status" /></td>
                      <td style="text-align:right">
                        <div style="display:flex;justify-content:flex-end;gap:4px">
                          <button class="icon-btn" [id]="'view-study-' + study.id" title="Ver estudio" [routerLink]="['/viewer', study.id]">
                            <mat-icon>visibility</mat-icon>
                          </button>
                          <button class="icon-btn" [id]="'edit-study-' + study.id" title="Editar estudio" (click)="openForm(study)">
                            <mat-icon>edit</mat-icon>
                          </button>
                          <button class="icon-btn" style="color:var(--color-error)" [id]="'delete-study-' + study.id" title="Eliminar estudio" (click)="deleteStudy(study)">
                            <mat-icon>delete</mat-icon>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                  @empty {
                    @if (!loading()) {
                      <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--color-on-surface-variant);font-size:14px">
                        No hay estudios registrados hoy.
                      </td></tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </section>

          <!-- Modal Form para Editar Estudio -->
          @if (showForm() && editStudy()) {
            <div class="modal-backdrop" (click)="closeForm()">
              <div class="modal-dialog" (click)="$event.stopPropagation()">
                <div class="panel-header" style="padding:20px;border-bottom:1px solid var(--color-outline-variant)">
                  <h2 style="margin:0;font-size:18px;font-weight:700">Editar Estudio #{{ editStudy()?.id }}</h2>
                  <button style="background:none;border:none;cursor:pointer;color:var(--color-on-surface-variant)" (click)="closeForm()">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <div style="padding:24px" [formGroup]="studyForm">
                  <div style="display:flex;flex-direction:column;gap:16px">
                    <div class="rw-form-field">
                      <label>Tipo de Estudio</label>
                      <input formControlName="study_type" class="rw-input" />
                    </div>
                    <div class="rw-form-field">
                      <label>Región Anatómica</label>
                      <input formControlName="body_area" class="rw-input" />
                    </div>
                    <div class="rw-form-field">
                      <label>Médico Referente</label>
                      <input formControlName="referring_doctor" class="rw-input" />
                    </div>
                    <div class="rw-form-field">
                      <label>Notas Clínicas</label>
                      <textarea formControlName="clinical_notes" class="rw-input" rows="3"></textarea>
                    </div>
                  </div>
                  @if (formErrorMsg()) {
                    <div style="margin-top:12px;padding:10px;border-radius:8px;background:var(--color-error-container);color:var(--color-on-error-container);font-size:12px">{{ formErrorMsg() }}</div>
                  }
                  <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px">
                    <button class="rw-btn rw-btn--ghost" (click)="closeForm()">Cancelar</button>
                    <button class="rw-btn rw-btn--primary" (click)="saveStudy()" [disabled]="formLoading() || studyForm.invalid">
                      @if (formLoading()) { <span class="rw-spinner" style="width:16px;height:16px;border-width:2px"></span> }
                      @else { <mat-icon>save</mat-icon> }
                      Guardar Cambios
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </main>
      </div>
    </div>
  `,
    styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .icon-btn {
      padding: 6px;
      border-radius: 8px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-primary);
      transition: background .15s;
      &:hover { background: rgb(0 77 153 / .1); }
    }
    .modal-backdrop { position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:100;display:flex;align-items:center;justify-content:center; }
    .modal-dialog { background:var(--color-surface-container-lowest);border-radius:16px;width:100%;max-width:480px;box-shadow:var(--shadow-xl); }
    .panel-header { display:flex;justify-content:space-between;align-items:center; }

    /* ── Privacy Mode: blur con hover-reveal ─────────── */
    .privacy-cell {
      transition: filter .2s ease;
    }
    .privacy-cell.blurred {
      filter: blur(6px);
      user-select: none;
      cursor: pointer;
    }
    .privacy-cell.blurred:hover {
      filter: blur(0);
      transition: filter .15s ease;
    }
  `]
})
export class TecnologoDashboardComponent implements OnInit {
  protected privacyMode = true;
  readonly loading = signal(true);
  readonly stats   = signal<StudyStats | null>(null);
  readonly studies = signal<Study[]>([]);

  readonly statCards = () => {
    const s = this.stats();
    return [
      { key: 'today',    label: 'Estudios hoy',       value: s?.today    ?? 0, icon: 'calendar_today', iconColor: 'var(--color-primary)', isError: false, progress: 75 },
      { key: 'pending',  label: 'Pendientes',          value: s?.pending  ?? 0, icon: 'warning',        iconColor: 'var(--color-error)',   isError: true,  progress: s?.today ? (s.pending / s.today) * 100 : 0 },
      { key: 'sent',     label: 'Enviados',            value: s?.sent     ?? 0, icon: 'send',           iconColor: 'var(--color-primary)', isError: false, progress: s?.today ? (s.sent / s.today) * 100 : 0 },
      { key: 'rejected', label: 'Rechazados',          value: s?.rejected ?? 0, icon: 'image_not_supported', iconColor: 'var(--color-error)', isError: true, progress: s?.today ? (s.rejected / s.today) * 100 : 0 },
    ];
  };

  readonly showForm    = signal(false);
  readonly editStudy   = signal<Study | null>(null);
  readonly formLoading = signal(false);
  readonly formErrorMsg = signal('');

  readonly studyForm = this.fb.nonNullable.group({
    study_type: ['', [Validators.required, Validators.minLength(2)]],
    body_area: ['', [Validators.required, Validators.minLength(2)]],
    referring_doctor: ['', [Validators.required, Validators.minLength(2)]],
    clinical_notes: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly api: ApiService,
    readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.api.getStudyStats().subscribe({
      next: r => this.stats.set(r.data ?? null),
      error: () => {},
    });
    this.loadStudies();
  }

  loadStudies(): void {
    this.loading.set(true);
    this.api.getStudies(1, 10).subscribe({
      next: r => {
        this.studies.set(r.data?.records ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openForm(study: Study): void {
    this.editStudy.set(study);
    this.formErrorMsg.set('');
    this.studyForm.patchValue({
      study_type: study.study_type,
      body_area: study.body_area,
      referring_doctor: study.referring_doctor,
      clinical_notes: study.clinical_notes ?? '',
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editStudy.set(null);
  }

  saveStudy(): void {
    if (this.studyForm.invalid || !this.editStudy()) return;
    this.formLoading.set(true);
    const dto = this.studyForm.getRawValue() as Partial<CreateStudyDto>;

    this.api.updateStudy(this.editStudy()!.id, dto).subscribe({
      next: () => {
        this.formLoading.set(false);
        this.closeForm();
        this.loadStudies();
      },
      error: (e) => {
        this.formLoading.set(false);
        this.formErrorMsg.set(e?.error?.message ?? 'Error guardando estudio');
      }
    });
  }

  deleteStudy(study: Study): void {
    if (study.status !== 'pendiente') {
      alert('Solo se pueden eliminar estudios en estado Pendiente.');
      return;
    }

    if (confirm(`¿Está seguro que desea eliminar el estudio #${study.id} del paciente ${study.patient_name}? Esta acción no se puede deshacer.`)) {
      this.api.deleteStudy(study.id).subscribe({
        next: () => this.loadStudies(),
        error: (e) => alert(e?.error?.message ?? 'Error eliminando el estudio')
      });
    }
  }
}
