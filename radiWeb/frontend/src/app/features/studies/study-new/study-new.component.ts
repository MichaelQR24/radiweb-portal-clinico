import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { Patient } from '../../../core/models/models';

@Component({
    selector: 'app-study-new',
    imports: [CommonModule, ReactiveFormsModule, MatIconModule, SidebarComponent, NavbarComponent],
    template: `
    <div class="rw-layout">
      <app-sidebar />
      <div class="rw-main">
        <app-navbar title="Registro de Estudio" />
        <main class="rw-content">
          <div style="max-width:900px;margin:0 auto">
            <!-- Header + Stepper -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px">
              <div class="rw-page-header" style="margin:0">
                <h1>Registro de Nuevo Estudio</h1>
                <p>Complete la información del paciente y los detalles del procedimiento.</p>
              </div>
              <div class="rw-stepper">
                @for (s of [1,2,3,4]; track s) {
                  <div class="step" [class.active]="currentStep() === s" [class.done]="currentStep() > s">
                    {{ currentStep() > s ? '✓' : s }}
                  </div>
                  @if (s < 4) { <div class="step-connector" [class.done]="currentStep() > s"></div> }
                }
              </div>
            </div>

            <!-- Step Cards -->
            <div class="rw-card" style="overflow:hidden">
              <!-- Step Header -->
              <div style="padding:20px 24px;border-bottom:1px solid var(--color-outline-variant);background:var(--color-surface-container-low);display:flex;align-items:center;gap:12px">
                <mat-icon style="color:var(--color-primary)">{{ stepIcons[currentStep()-1] }}</mat-icon>
                <h2 style="margin:0;font-size:18px;font-weight:700">{{ stepTitles[currentStep()-1] }}</h2>
              </div>

              <div style="padding:32px">
                <!-- Paso 1: Búsqueda / Datos del Paciente -->
                @if (currentStep() === 1) {
                  <div style="display:flex;flex-direction:column;gap:16px">
                    <div style="display:flex;gap:12px;margin-bottom:8px">
                      <div style="flex:1;position:relative">
                        <input class="rw-input" id="input-dni-search" type="text" placeholder="Buscar por DNI..."
                          [value]="dniSearch()" (input)="dniSearch.set($any($event.target).value)"
                          style="padding-right:100px"/>
                        <button class="rw-btn rw-btn--primary" id="btn-search-patient" (click)="searchPatient()"
                          style="position:absolute;right:4px;top:50%;transform:translateY(-50%);padding:6px 16px;font-size:12px">
                          Buscar
                        </button>
                      </div>
                    </div>

                    @if (foundPatient()) {
                      <div style="padding:16px;border-radius:8px;background:rgba(0,77,153,.05);border:1px solid rgba(0,77,153,.2)">
                        <p style="margin:0;font-size:12px;font-weight:700;color:var(--color-primary);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Paciente encontrado</p>
                        <p style="margin:0;font-size:15px;font-weight:700">{{ foundPatient()!.full_name }}</p>
                        <p style="margin:4px 0 0;font-size:12px;color:var(--color-on-surface-variant)">DNI: {{ foundPatient()!.dni }} · Edad: {{ foundPatient()!.age }} · Género: {{ foundPatient()!.gender }}</p>
                      </div>
                    }

                    <div style="margin-top:16px">
                      <p style="font-size:12px;font-weight:700;color:var(--color-on-surface-variant);text-transform:uppercase;letter-spacing:.06em;margin:0 0 16px">O registrar nuevo paciente</p>
                      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px" [formGroup]="patientForm">
                        <div class="rw-form-field">
                          <label for="full_name">Nombre Completo</label>
                          <input id="full_name" formControlName="full_name" class="rw-input" placeholder="Ej. Juan Pérez García"/>
                        </div>
                        <div class="rw-form-field">
                          <label for="dni">DNI</label>
                          <input id="dni" formControlName="dni" class="rw-input" placeholder="12345678" maxlength="8"/>
                        </div>
                        <div class="rw-form-field">
                          <label for="age">Edad</label>
                          <input id="age" formControlName="age" class="rw-input" type="number" min="0" max="150"/>
                        </div>
                        <div class="rw-form-field">
                          <label for="gender">Género</label>
                          <select id="gender" formControlName="gender" class="rw-input">
                            <option value="">Seleccione...</option>
                            <option value="M">Masculino</option>
                            <option value="F">Femenino</option>
                            <option value="O">Otro</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                }

                <!-- Paso 2: Datos del Estudio -->
                @if (currentStep() === 2) {
                  <div [formGroup]="studyForm" style="display:flex;flex-direction:column;gap:18px">
                    <div class="rw-form-field">
                      <label for="study_type">Tipo de Estudio / Modalidad</label>
                      <select id="study_type" formControlName="study_type" class="rw-input">
                        <option value="">Seleccione modalidad...</option>
                        @for (t of studyTypes; track t) { <option [value]="t">{{ t }}</option> }
                      </select>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                      <div class="rw-form-field">
                        <label for="body_area">Región Anatómica</label>
                        <input id="body_area" formControlName="body_area" class="rw-input" placeholder="Ej. Tórax"/>
                      </div>
                      <div class="rw-form-field">
                        <label for="referring_doctor">Médico Referente</label>
                        <input id="referring_doctor" formControlName="referring_doctor" class="rw-input" placeholder="Dr. García"/>
                      </div>
                    </div>
                    <div class="rw-form-field">
                      <label for="clinical_notes">Notas Clínicas</label>
                      <textarea id="clinical_notes" formControlName="clinical_notes" class="rw-input" rows="4" placeholder="Descripción clínica..." style="resize:vertical"></textarea>
                    </div>
                  </div>
                }

                <!-- Paso 3: Carga de Imágenes DICOM -->
                @if (currentStep() === 3) {
                  <div>
                    <div id="dropzone"
                      class="dropzone"
                      [class.dragging]="isDragging()"
                      (dragover)="onDragOver($event)"
                      (dragleave)="isDragging.set(false)"
                      (drop)="onDrop($event)"
                      (click)="fileInput.click()"
                    >
                      <mat-icon style="font-size:48px;width:48px;height:48px;color:var(--color-outline);margin-bottom:12px">cloud_upload</mat-icon>
                      <p style="margin:0;font-weight:700;color:var(--color-on-surface)">Arrastre archivos DICOM aquí</p>
                      <p style="margin:4px 0 0;font-size:12px;color:var(--color-on-surface-variant);opacity:.7">o haga clic para seleccionar · DCM, PNG, JPG · Máx. 100MB</p>
                      <input #fileInput type="file" style="display:none" multiple accept=".dcm,.dicom,.png,.jpg,.jpeg" (change)="onFileSelected($event)"/>
                    </div>

                    @if (selectedFiles().length > 0) {
                      <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px">
                        @for (f of selectedFiles(); track f.name) {
                          <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:8px;background:var(--color-surface-container-low);border:1px solid var(--color-outline-variant)">
                            <mat-icon style="color:var(--color-primary)">description</mat-icon>
                            <div style="flex:1">
                              <div style="font-size:13px;font-weight:600">{{ f.name }}</div>
                              <div style="font-size:11px;color:var(--color-on-surface-variant)">{{ (f.size/1024).toFixed(0) }} KB</div>
                            </div>
                            <mat-icon style="color:var(--color-error);cursor:pointer" (click)="removeFile(f)">close</mat-icon>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }

                <!-- Paso 4: Confirmación -->
                @if (currentStep() === 4) {
                  <div style="display:flex;flex-direction:column;gap:20px">
                    <div style="padding:20px;border-radius:12px;background:var(--color-surface-container-low);border:1px solid var(--color-outline-variant)">
                      <h3 style="margin:0 0 12px;font-size:14px;font-weight:700;color:var(--color-primary);text-transform:uppercase;letter-spacing:.06em">Paciente</h3>
                      <p style="margin:0;font-size:16px;font-weight:700">{{ foundPatient()?.full_name ?? patientForm.get('full_name')?.value }}</p>
                      <p style="margin:4px 0 0;font-size:13px;color:var(--color-on-surface-variant)">DNI: {{ foundPatient()?.dni ?? patientForm.get('dni')?.value }}</p>
                    </div>
                    <div style="padding:20px;border-radius:12px;background:var(--color-surface-container-low);border:1px solid var(--color-outline-variant)">
                      <h3 style="margin:0 0 12px;font-size:14px;font-weight:700;color:var(--color-primary);text-transform:uppercase;letter-spacing:.06em">Estudio</h3>
                      <p style="margin:0;font-size:15px;font-weight:700">{{ studyForm.get('study_type')?.value }}</p>
                      <p style="margin:4px 0 0;font-size:13px;color:var(--color-on-surface-variant)">Área: {{ studyForm.get('body_area')?.value }} · Dr. {{ studyForm.get('referring_doctor')?.value }}</p>
                    </div>
                    <div style="padding:20px;border-radius:12px;background:var(--color-surface-container-low);border:1px solid var(--color-outline-variant)">
                      <h3 style="margin:0 0 8px;font-size:14px;font-weight:700;color:var(--color-primary);text-transform:uppercase;letter-spacing:.06em">Imágenes</h3>
                      <p style="margin:0;font-size:15px;font-weight:700">{{ selectedFiles().length }} archivo(s) seleccionado(s)</p>
                    </div>

                    @if (errorMsg()) {
                      <div style="padding:12px;border-radius:8px;background:var(--color-error-container);color:var(--color-on-error-container);font-size:13px;display:flex;align-items:center;gap:8px">
                        <mat-icon style="font-size:16px;width:16px;height:16px">warning</mat-icon>
                        {{ errorMsg() }}
                      </div>
                    }
                  </div>
                }

                <!-- Botones de navegación -->
                <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:32px;padding-top:24px;border-top:1px solid var(--color-outline-variant)">
                  <button class="rw-btn rw-btn--ghost" id="btn-cancel" (click)="goBack()">
                    {{ currentStep() === 1 ? 'Cancelar' : 'Atrás' }}
                  </button>
                  @if (currentStep() < 4) {
                    <button class="rw-btn rw-btn--primary" id="btn-next" (click)="nextStep()">
                      Siguiente <mat-icon>chevron_right</mat-icon>
                    </button>
                  } @else {
                    <button class="rw-btn rw-btn--primary" id="btn-submit" (click)="submit()" [disabled]="loading()">
                      @if (loading()) { <span class="rw-spinner" style="width:16px;height:16px;border-width:2px"></span> }
                      @else { <mat-icon>save</mat-icon> }
                      Completar Registro
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
    styles: [`
    .dropzone {
      border: 2px dashed var(--color-outline-variant);
      border-radius: 12px;
      padding: 48px 24px;
      text-align: center;
      cursor: pointer;
      transition: all .2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      &:hover, &.dragging {
        border-color: var(--color-primary);
        background: rgba(0,77,153,.03);
      }
    }
  `]
})
export class StudyNewComponent {
  readonly currentStep   = signal(1);
  readonly loading       = signal(false);
  readonly isDragging    = signal(false);
  readonly foundPatient  = signal<Patient | null>(null);
  readonly selectedFiles = signal<File[]>([]);
  readonly dniSearch     = signal('');
  readonly errorMsg      = signal('');

  readonly stepTitles = ['Información del Paciente', 'Detalles del Estudio', 'Carga de Imágenes', 'Confirmación y Envío'];
  readonly stepIcons  = ['person', 'description', 'cloud_upload', 'check_circle'];
  readonly studyTypes = ['Resonancia Magnética (MRI)', 'Tomografía Computarizada (CT)', 'Rayos X', 'Ecografía', 'Mamografía', 'Densitometría Ósea'];

  readonly patientForm = this.fb.nonNullable.group({
    full_name: ['', Validators.required],
    dni:       ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    age:       [0,  [Validators.required, Validators.min(0)]],
    gender:    ['', Validators.required],
  });

  readonly studyForm = this.fb.nonNullable.group({
    study_type:       ['', Validators.required],
    body_area:        ['', Validators.required],
    referring_doctor: ['', Validators.required],
    clinical_notes:   [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly api: ApiService,
    private readonly router: Router,
  ) {}

  searchPatient(): void {
    const dni = this.dniSearch().trim();
    if (!dni) return;
    this.api.getPatients(1, 1, dni).subscribe({
      next: r => {
        const patient = r.data?.records[0] ?? null;
        this.foundPatient.set(patient);
      },
      error: () => this.foundPatient.set(null),
    });
  }

  nextStep(): void {
    if (this.currentStep() < 4) this.currentStep.update(s => s + 1);
  }

  goBack(): void {
    if (this.currentStep() === 1) {
      void this.router.navigate(['/dashboard/tecnologo']);
    } else {
      this.currentStep.update(s => s - 1);
    }
  }

  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragging.set(true); }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    this.selectedFiles.update(prev => [...prev, ...files]);
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.selectedFiles.update(prev => [...prev, ...files]);
  }

  removeFile(file: File): void {
    this.selectedFiles.update(prev => prev.filter(f => f !== file));
  }

  submit(): void {
    this.loading.set(true);
    this.errorMsg.set('');

    const patient = this.foundPatient();
    const createPatient$ = patient
      ? new Promise<Patient>(resolve => resolve(patient))
      : this.api.createPatient(this.patientForm.getRawValue() as any).toPromise().then(r => r!.data!);

    createPatient$.then(p => {
      const studyDto = { patient_id: p.id, ...this.studyForm.getRawValue() };
      this.api.createStudy(studyDto).subscribe({
        next: studyRes => {
          const study = studyRes.data!;
          if (this.selectedFiles().length > 0) {
            this.api.uploadImages(study.id, this.selectedFiles()).subscribe({
              next: () => { this.loading.set(false); void this.router.navigate(['/dashboard/tecnologo']); },
              error: () => { this.loading.set(false); void this.router.navigate(['/dashboard/tecnologo']); },
            });
          } else {
            this.loading.set(false);
            void this.router.navigate(['/dashboard/tecnologo']);
          }
        },
        error: (e) => { this.loading.set(false); this.errorMsg.set(e?.error?.message ?? 'Error creando estudio'); },
      });
    }).catch(e => { this.loading.set(false); this.errorMsg.set(e?.error?.message ?? 'Error creando paciente'); });
  }
}
