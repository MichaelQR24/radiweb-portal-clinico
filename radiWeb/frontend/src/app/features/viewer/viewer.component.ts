import { Component, OnInit, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { Study, Image, Diagnosis } from '../../core/models/models';

@Component({
    selector: 'app-viewer',
    imports: [CommonModule, ReactiveFormsModule, MatIconModule, SidebarComponent, NavbarComponent, StatusBadgeComponent],
    template: `
    <div class="rw-layout">
      <app-sidebar />
      <div class="rw-main">
        <app-navbar title="Visor de Estudio" />

        <div class="viewer-container">
          <!-- Left Panel: Patient Info -->
          <aside class="viewer-left-panel">
            <div class="panel-header">
              <h2>Detalles del Paciente</h2>
              <mat-icon style="color:var(--color-outline)">info</mat-icon>
            </div>
            <div class="panel-body">
              @if (study()) {
                <div class="info-group">
                  <span class="info-label">Nombre Completo</span>
                  <span class="info-value" style="font-weight:700">{{ study()!.patient_name }}</span>
                </div>
                <div style="display:flex;gap:16px">
                  <div class="info-group">
                    <span class="info-label">DNI</span>
                    <span class="info-value" style="color:var(--color-primary);font-weight:700">{{ study()!.patient_dni }}</span>
                  </div>
                  <div class="info-group">
                    <span class="info-label">Edad/Género</span>
                    <span class="info-value">{{ study()!.patient_age }}A / {{ study()!.patient_gender }}</span>
                  </div>
                </div>
                <hr style="border-color:rgba(194,198,212,.3);margin:4px 0"/>
                <div class="info-group">
                  <span class="info-label">Fecha Estudio</span>
                  <span class="info-value">{{ study()!.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="info-group">
                  <span class="info-label">Modalidad</span>
                  <span style="padding:2px 8px;border-radius:4px;background:rgba(0,77,153,.1);color:var(--color-primary);font-size:10px;font-weight:700">
                    {{ study()!.study_type }}
                  </span>
                </div>
                <div class="info-group">
                  <span class="info-label">Estado</span>
                  <app-status-badge [status]="study()!.status" />
                </div>
                <hr style="border-color:rgba(194,198,212,.3);margin:4px 0"/>
                <div class="info-group">
                  <span class="info-label">Indicación Clínica</span>
                  <p style="font-size:12px;color:var(--color-on-surface-variant);line-height:1.5;margin:0">{{ study()!.clinical_notes || 'Sin notas clínicas.' }}</p>
                </div>
                <div class="info-group">
                  <span class="info-label">Médico Referente</span>
                  <span class="info-value">{{ study()!.referring_doctor }}</span>
                </div>
              } @else {
                <div class="rw-spinner" style="margin:40px auto"></div>
              }
            </div>
          </aside>

          <!-- Center: DICOM Viewer -->
          <div class="viewer-center">
            <!-- Toolbar -->
            <div class="viewer-toolbar">
              <div class="toolbar-group">
                <button class="tool-btn" id="btn-zoom-in"  title="Zoom +" (click)="zoom(1.2)"><mat-icon>zoom_in</mat-icon></button>
                <button class="tool-btn" id="btn-zoom-out" title="Zoom -" (click)="zoom(0.8)"><mat-icon>zoom_out</mat-icon></button>
                <button class="tool-btn" id="btn-reset" title="Restaurar Vista" (click)="resetView()"><mat-icon>filter_center_focus</mat-icon></button>
              </div>
              <div class="toolbar-group" style="display:flex; flex-direction:column; justify-content:center; gap: 4px; padding: 0 16px;">
                <div style="display:flex; align-items:center; gap:8px; color:rgba(255,255,255,.7)" title="Brillo">
                  <mat-icon style="font-size:14px;width:14px;height:14px">light_mode</mat-icon>
                  <input type="range" min="50" max="200" [value]="brightnessLevel()" (input)="setBrightness($event)" style="width:70px; height:4px; accent-color:var(--color-primary); cursor:pointer">
                </div>
                <div style="display:flex; align-items:center; gap:8px; color:rgba(255,255,255,.7)" title="Contraste">
                  <mat-icon style="font-size:14px;width:14px;height:14px">contrast</mat-icon>
                  <input type="range" min="50" max="200" [value]="contrastLevel()" (input)="setContrast($event)" style="width:70px; height:4px; accent-color:var(--color-primary); cursor:pointer">
                </div>
              </div>
              <div class="toolbar-group">
                <button class="tool-btn" id="btn-rotate"   title="Rotar" (click)="rotate()"><mat-icon>rotate_right</mat-icon></button>
                <button class="tool-btn" id="btn-flip"     title="Voltear"><mat-icon>flip</mat-icon></button>
                <button class="tool-btn" id="btn-ruler"    title="Regla"><mat-icon>straighten</mat-icon></button>
              </div>
              <div style="margin-left:auto;font-family:monospace;font-size:10px;color:var(--color-outline);display:flex;gap:16px;text-transform:uppercase;letter-spacing:.06em">
                <span>Img: {{ imageIndex()+1 }}/{{ images().length || 1 }}</span>
                <span>Zoom: {{ (zoomLevel() * 100).toFixed(0) }}%</span>
              </div>
            </div>

            <!-- Viewport -->
            <div class="viewer-viewport" id="dicom-viewport"
                 (mousedown)="onMouseDown($event)"
                 (mousemove)="onMouseMove($event)"
                 (mouseup)="onMouseUp()"
                 (mouseleave)="onMouseUp()"
                 style="cursor: grab"
                 [style.cursor]="isDragging ? 'grabbing' : 'grab'">
              <!-- Overlays -->
              <div class="overlay overlay-tl" *ngIf="study()">
                <p>{{ study()!.patient_name }}</p>
                <p>DNI: {{ study()!.patient_dni }}</p>
              </div>
              <div class="overlay overlay-tr">
                <p>DIRIS Lima Centro</p>
                <p>{{ study()?.created_at | date:'yyyy-MM-dd HH:mm' }}</p>
                <p>{{ study()?.study_type }}</p>
              </div>
              <div class="overlay overlay-bl">
                <p>Zoom: {{ (zoomLevel() * 100).toFixed(0) }}%</p>
                <p>WL: 120 / WW: 300</p>
              </div>

              <!-- Central content: placeholder or real image -->
              @if (images().length > 0) {
                <img [src]="images()[imageIndex()].preview_url || ('https://picsum.photos/seed/radiweb' + images()[imageIndex()].id + '/800/800?grayscale')"
                     [style.transform]="'translate(' + panX() + 'px, ' + panY() + 'px) rotate(' + rotationDeg() + 'deg) scale(' + zoomLevel() + ')'"
                     [style.filter]="'brightness(' + brightnessLevel() + '%) contrast(' + contrastLevel() + '%)'"
                     style="max-width:80%;max-height:80%;object-fit:contain;transition:transform 0.05s ease-out, filter 0.1s; pointer-events: none" alt="Imagen DICOM"/>
              } @else {
                <!-- MRI visual placeholder (matches prototype) -->
                <div class="mri-placeholder">
                  <div class="mri-ring mri-ring--outer"></div>
                  <div class="mri-ring mri-ring--inner"></div>
                </div>
                <div style="position:absolute;bottom:30%;color:rgba(255,255,255,.4);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em">
                  Sin imágenes DICOM adjuntas
                </div>
              }

              <!-- Navigation arrows -->
              @if (images().length > 1) {
                <button class="nav-arrow nav-arrow--left" id="btn-prev-image" (click)="prevImage()"><mat-icon>chevron_left</mat-icon></button>
                <button class="nav-arrow nav-arrow--right" id="btn-next-image" (click)="nextImage()"><mat-icon>chevron_right</mat-icon></button>
              }
            </div>

            <!-- Footer -->
            <footer class="viewer-footer">
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:8px;height:8px;border-radius:50%;background:#22c55e"></div>
                SYSTEM CONNECTED
                <mat-icon style="font-size:12px;width:12px;height:12px">storage</mat-icon>
                AZURE CLOUD
              </div>
              <div style="display:flex;gap:16px">
                <span>{{ images().length }} imagen(es)</span>
                <span style="color:var(--color-primary)">Calidad: Óptima</span>
              </div>
            </footer>
          </div>

          <!-- Right Panel: Diagnosis (radiologo only) -->
          @if (auth.currentRole() === 'radiologo' || auth.currentRole() === 'admin') {
            <aside class="viewer-right-panel">
              <div class="panel-header">
                <h2>Informe Diagnóstico</h2>
                <mat-icon style="color:var(--color-outline)">mic</mat-icon>
              </div>
              <div class="panel-body" style="flex:1;display:flex;flex-direction:column;gap:16px">
                <div [formGroup]="diagForm" style="flex:1;display:flex;flex-direction:column;gap:16px">
                  <div style="flex:1;display:flex;flex-direction:column;gap:4px">
                    <div style="display:flex;justify-content:space-between">
                      <label class="rw-label" style="margin:0">Hallazgos</label>
                      <span style="font-size:9px;color:var(--color-outline)">Auto-guardado</span>
                    </div>
                    <div style="flex:1;border:1px solid var(--color-outline-variant);border-radius:8px;overflow:hidden;display:flex;flex-direction:column;background:var(--color-surface)">
                      <div style="padding:6px 8px;border-bottom:1px solid var(--color-outline-variant);background:var(--color-surface-container-lowest);display:flex;gap:4px">
                        <button style="padding:4px 8px;font-size:11px;font-weight:900;background:none;border:none;cursor:pointer;border-radius:4px;font-family:serif" title="Negrita">B</button>
                        <button style="padding:4px 8px;font-size:11px;font-style:italic;background:none;border:none;cursor:pointer;border-radius:4px;font-family:serif" title="Cursiva">I</button>
                      </div>
                      <textarea
                        formControlName="report_text"
                        id="diagnosis-report-text"
                        style="flex:1;padding:12px;font-size:12px;line-height:1.6;background:transparent;border:none;outline:none;resize:none;font-family:var(--font-sans)"
                        placeholder="Describa los hallazgos radiológicos..."
                      ></textarea>
                    </div>
                  </div>

                  <div class="rw-form-field">
                    <label for="conclusion">Impresión / Conclusión</label>
                    <select id="conclusion" formControlName="conclusion" class="rw-input" style="font-size:12px">
                      <option value="">Seleccione conclusión...</option>
                      <option value="Estudio dentro de límites normales.">Normal – Sin hallazgos significativos</option>
                      <option value="Pérdida de volumen leve relacionada con la edad.">Leve pérdida de volumen relacionada con la edad</option>
                      <option value="Hallazgo sugestivo de evento agudo. Requiere correlación clínica urgente.">Hallazgo sugestivo de evento agudo (URGENTE)</option>
                      <option value="Proceso inflamatorio/infeccioso. Correlacionar con clínica.">Proceso inflamatorio / infeccioso</option>
                    </select>
                  </div>
                </div>

                @if (diagErrorMsg()) {
                  <div style="padding:10px 12px;border-radius:8px;background:var(--color-error-container);color:var(--color-on-error-container);font-size:12px">
                    {{ diagErrorMsg() }}
                  </div>
                }
                @if (diagSuccess()) {
                  <div style="padding:10px 12px;border-radius:8px;background:#e8f5e9;color:#1b5e20;font-size:12px;font-weight:600">
                    ✓ Diagnóstico guardado exitosamente
                  </div>
                }
              </div>

              <div style="padding:16px;border-top:1px solid var(--color-outline-variant);background:var(--color-surface-container-low)">
                <button class="rw-btn rw-btn--primary" id="btn-sign-report" style="width:100%;justify-content:center"
                  (click)="submitDiagnosis()" [disabled]="diagLoading() || diagForm.invalid">
                  @if (diagLoading()) { <span class="rw-spinner" style="width:16px;height:16px;border-width:2px"></span> }
                  @else { <mat-icon>verified</mat-icon> }
                  Firmar y Enviar Informe
                </button>
              </div>
            </aside>
          }
        </div>
      </div>
    </div>
  `,
    styles: [`
    .viewer-container {
      display: flex;
      height: calc(100vh - 56px);
      overflow: hidden;
      padding: 12px;
      gap: 12px;
      background: var(--color-surface-container-low);
    }
    .viewer-left-panel, .viewer-right-panel {
      width: 300px;
      background: var(--color-surface-container-lowest);
      border: 1px solid var(--color-outline-variant);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .viewer-right-panel { width: 360px; }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid var(--color-outline-variant);
      background: var(--color-surface-container-low);
      h2 { margin: 0; font-size: 13px; font-weight: 700; }
    }
    .panel-body {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .info-group {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .info-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: var(--color-on-surface-variant);
      opacity: .6;
    }
    .info-value {
      font-size: 14px;
      color: var(--color-on-surface);
    }
    .viewer-center {
      flex: 1;
      background: black;
      border-radius: 12px;
      border: 1px solid #333;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,77,153,.1);
    }
    .viewer-toolbar {
      height: 48px;
      background: #0a0a0a;
      border-bottom: 1px solid rgba(255,255,255,.1);
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 16px;
      flex-shrink: 0;
    }
    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 2px;
      padding-right: 12px;
      border-right: 1px solid rgba(255,255,255,.1);
    }
    .tool-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(255,255,255,.5);
      border-radius: 6px;
      transition: all .15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { color: white; background: rgba(255,255,255,.1); }
      &.active { color: var(--color-primary); background: rgba(0,77,153,.2); box-shadow: 0 0 0 1px rgba(0,77,153,.4); }
    }
    .viewer-viewport {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .overlay {
      position: absolute;
      font-family: monospace;
      font-size: 11px;
      color: rgba(255,255,255,.5);
      line-height: 1.6;
      p { margin: 0; }
    }
    .overlay-tl { top: 20px; left: 20px; }
    .overlay-tr { top: 20px; right: 20px; text-align: right; }
    .overlay-bl { bottom: 20px; left: 20px; }
    .mri-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .mri-ring {
      position: absolute;
      border-radius: 50%;
      border-style: solid;
      filter: blur(40px);
      opacity: .4;
    }
    .mri-ring--outer { width: 60%; height: 60%; border-width: 20px; border-color: rgba(255,255,255,.1); }
    .mri-ring--inner { width: 40%; height: 40%; border-width: 10px; border-color: rgba(0,77,153,.1); }
    .nav-arrow {
      position: absolute;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255,255,255,.05);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background .15s;
      &:hover { background: rgba(255,255,255,.15); }
    }
    .nav-arrow--left  { left: 12px; top: 50%; transform: translateY(-50%); }
    .nav-arrow--right { right: 12px; top: 50%; transform: translateY(-50%); }
    .viewer-footer {
      height: 32px;
      background: var(--color-surface-container-lowest);
      border-top: 1px solid rgba(255,255,255,.05);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: rgba(255,255,255,.4);
      flex-shrink: 0;
    }
  `]
})
export class ViewerComponent implements OnInit {
  @Input() studyId!: string;

  readonly study      = signal<Study | null>(null);
  readonly images     = signal<Image[]>([]);
  readonly imageIndex = signal(0);
  readonly zoomLevel  = signal(1);
  readonly rotationDeg = signal(0);
  readonly brightnessLevel = signal(100);
  readonly contrastLevel = signal(100);
  readonly panX = signal(0);
  readonly panY = signal(0);
  readonly diagLoading = signal(false);
  readonly diagSuccess = signal(false);
  readonly diagErrorMsg = signal('');

  readonly diagForm = this.fb.nonNullable.group({
    report_text: ['', [Validators.required, Validators.minLength(10)]],
    conclusion:  ['', Validators.required],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly api: ApiService,
    readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    const id = parseInt(this.studyId, 10);
    this.api.getStudy(id).subscribe({ next: r => this.study.set(r.data ?? null) });
    this.api.getImages(id).subscribe({ next: r => this.images.set(r.data ?? []) });
    this.api.getDiagnosis(id).subscribe({
      next: r => {
        if (r.data) {
          this.diagForm.patchValue({ report_text: r.data.report_text, conclusion: r.data.conclusion });
        }
      },
      error: () => {},
    });
  }

  zoom(factor: number): void { this.zoomLevel.update(z => Math.max(0.3, Math.min(4, z * factor))); }
  rotate(): void { this.rotationDeg.update(d => (d + 90) % 360); }
  prevImage(): void { this.imageIndex.update(i => Math.max(0, i - 1)); }
  nextImage(): void { this.imageIndex.update(i => Math.min(this.images().length - 1, i + 1)); }

  setBrightness(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.brightnessLevel.set(parseInt(val, 10));
  }

  setContrast(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.contrastLevel.set(parseInt(val, 10));
  }

  isDragging = false;
  startX = 0;
  startY = 0;

  onMouseDown(e: MouseEvent): void {
    e.preventDefault(); // Evita drag nativo del navegador
    this.isDragging = true;
    this.startX = e.clientX - this.panX();
    this.startY = e.clientY - this.panY();
  }

  onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    this.panX.set(e.clientX - this.startX);
    this.panY.set(e.clientY - this.startY);
  }

  onMouseUp(): void {
    this.isDragging = false;
  }

  resetView(): void {
    this.zoomLevel.set(1);
    this.rotationDeg.set(0);
    this.panX.set(0);
    this.panY.set(0);
    this.brightnessLevel.set(100);
    this.contrastLevel.set(100);
  }

  submitDiagnosis(): void {
    if (this.diagForm.invalid) { this.diagForm.markAllAsTouched(); return; }
    this.diagLoading.set(true);
    this.diagErrorMsg.set('');
    const studyId = parseInt(this.studyId, 10);
    const dto = { study_id: studyId, ...this.diagForm.getRawValue() };
    this.api.createDiagnosis(dto).subscribe({
      next: () => { this.diagLoading.set(false); this.diagSuccess.set(true); },
      error: e => { this.diagLoading.set(false); this.diagErrorMsg.set(e?.error?.message ?? 'Error guardando diagnóstico'); },
    });
  }
}
