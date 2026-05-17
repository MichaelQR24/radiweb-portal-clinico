import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { Study } from '../../../core/models/models';

@Component({
    selector: 'app-radiologo-dashboard',
    imports: [CommonModule, MatIconModule, SidebarComponent, NavbarComponent],
    template: `
    <div class="rw-layout">
      <app-sidebar />
      <div class="rw-main">
        <app-navbar
          title="Cola de Trabajo Radiología"
          [privacyMode]="privacyMode()"
          (privacyModeChange)="privacyMode.set($event)"
        />
        <main class="rw-content">
          <div class="rw-page-header">
            <h1>Cola de Trabajo</h1>
            <p>Estudios pendientes de diagnóstico ordenados por fecha.</p>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
            <div class="rw-card" style="padding:20px;border-top:4px solid var(--color-error)" id="stat-pending">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--color-on-surface-variant)">Pendientes</span>
                <mat-icon style="color:var(--color-error)">warning</mat-icon>
              </div>
              <div style="font-size:40px;font-weight:900">{{ pendingCount() }}</div>
            </div>
            <div class="rw-card" style="padding:20px;border-top:4px solid var(--color-primary)" id="stat-done">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--color-on-surface-variant)">Completados</span>
                <mat-icon style="color:var(--color-primary)">check_circle</mat-icon>
              </div>
              <div style="font-size:40px;font-weight:900">{{ doneCount() }}</div>
            </div>
            <div class="rw-card" style="padding:20px;border-top:4px solid var(--color-secondary)" id="stat-tat">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--color-on-surface-variant)">TAT Promedio</span>
                <mat-icon style="color:var(--color-secondary)">schedule</mat-icon>
              </div>
              <div style="display:flex;align-items:baseline;gap:4px">
                <span style="font-size:40px;font-weight:900">45</span>
                <span style="font-size:14px;color:var(--color-on-surface-variant)">min</span>
              </div>
            </div>
          </div>
          <section class="rw-card" style="overflow:hidden;margin-top:24px">
            <div style="padding:14px 20px;border-bottom:1px solid var(--color-outline-variant);background:var(--color-surface-container-low);display:flex;align-items:center;justify-content:space-between">
              <h2 style="font-size:16px;font-weight:700;margin:0">Lista de Estudios</h2>
              @if (privacyMode()) {
                <span class="privacy-badge">
                  <mat-icon style="font-size:12px;width:12px;height:12px;margin-right:4px">visibility_off</mat-icon>
                  Datos ocultos
                </span>
              }
            </div>
            <div style="overflow-x:auto">
              <table class="rw-table">
                <thead><tr>
                  <th>Paciente</th><th>ID</th><th>Modalidad</th><th>Fecha</th><th>Estado</th>
                </tr></thead>
                <tbody>
                  @if (loading()) {
                    <tr><td colspan="5" style="text-align:center;padding:40px">
                      <div class="rw-spinner" style="margin:0 auto"></div>
                    </td></tr>
                  }
                  @for (s of studies(); track s.id) {
                    <tr class="clickable" [id]="'row-' + s.id" (click)="openViewer(s.id)">
                      <td>
                        <div class="patient-name" [class.blurred]="privacyMode()" style="font-weight:700">{{ s.patient_name }}</div>
                        <div class="patient-dni" [class.blurred]="privacyMode()" style="font-size:10px;opacity:.6">DNI: {{ s.patient_dni }}</div>
                      </td>
                      <td style="font-size:12px;color:var(--color-on-surface-variant)">#{{ s.id }}</td>
                      <td><span style="padding:2px 8px;border-radius:4px;border:1px solid var(--color-outline-variant);font-size:10px;font-weight:700">{{ s.study_type }}</span></td>
                      <td style="font-size:12px;color:var(--color-on-surface-variant)">{{ s.created_at | date:'dd/MM HH:mm' }}</td>
                      <td><span class="rw-badge rw-badge--{{ s.status }}">{{ s.status }}</span></td>
                    </tr>
                  }
                  @empty {
                    @if (!loading()) {
                      <tr><td colspan="5" style="text-align:center;padding:40px;color:var(--color-on-surface-variant)">No hay estudios en cola.</td></tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  `,
    styles: [`
    /* ── Privacy Mode blur con hover-reveal ─────── */
    .patient-name,
    .patient-dni {
      transition: filter .2s ease;
    }
    .patient-name.blurred,
    .patient-dni.blurred {
      filter: blur(6px);
      user-select: none;
      cursor: pointer;
    }
    .patient-name.blurred:hover,
    .patient-dni.blurred:hover {
      filter: blur(0);
      transition: filter .15s ease;
    }

    /* Badge "Datos ocultos" en el header de la tabla */
    .privacy-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 9999px;
      background: #fff3e0;
      border: 1px solid #ffb300;
      color: #e65100;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      gap: 2px;
    }
  `]
})
export class RadiologoDashboardComponent implements OnInit {
  readonly loading     = signal(true);
  readonly studies     = signal<Study[]>([]);
  readonly privacyMode = signal(true);

  readonly pendingCount = () => this.studies().filter(s => s.status === 'pendiente' || s.status === 'enviado').length;
  readonly doneCount    = () => this.studies().filter(s => s.status === 'diagnosticado').length;

  constructor(
    private readonly api: ApiService,
    readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.api.getStudies(1, 20).subscribe({
      next: r => { this.studies.set(r.data?.records ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openViewer(id: number): void { void this.router.navigate(['/viewer', id]); }
}


