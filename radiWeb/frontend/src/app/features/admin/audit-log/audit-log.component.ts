import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { AuditLog } from '../../../core/models/models';

@Component({
    selector: 'app-audit-log',
    imports: [CommonModule, MatIconModule, SidebarComponent, NavbarComponent],
    template: `
    <div class="rw-layout">
      <app-sidebar />
      <div class="rw-main">
        <app-navbar title="Registro de Auditoría" />
        <main class="rw-content">
          <div class="rw-page-header">
            <h1>Registro de Auditoría</h1>
            <p>Historial completo de acciones de usuarios en el sistema.</p>
          </div>

          <section class="rw-card" style="overflow:hidden">
            <div style="padding:14px 20px;border-bottom:1px solid var(--color-outline-variant);background:var(--color-surface-container-low)">
              <h2 style="margin:0;font-size:16px;font-weight:700">Log de Auditoría</h2>
            </div>
            <div style="overflow-x:auto">
              <table class="rw-table">
                <thead>
                  <tr>
                    <th>Fecha/Hora</th>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Entidad</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  @if (loading()) {
                    <tr><td colspan="5" style="text-align:center;padding:40px"><div class="rw-spinner" style="margin:0 auto"></div></td></tr>
                  }
                  @for (log of logs(); track log.id) {
                    <tr [id]="'log-' + log.id">
                      <td style="font-size:12px;color:var(--color-on-surface-variant);white-space:nowrap">{{ log.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                      <td>
                        <div style="font-weight:600;font-size:13px">{{ log.user_name }}</div>
                        <div style="font-size:11px;color:var(--color-on-surface-variant);opacity:.7">{{ log.user_email }}</div>
                      </td>
                      <td>
                        <span style="padding:2px 8px;border-radius:4px;background:var(--color-surface-container);font-size:10px;font-weight:700;font-family:monospace">
                          {{ log.action }}
                        </span>
                      </td>
                      <td style="font-size:12px;color:var(--color-on-surface-variant)">
                        {{ log.entity }} @if (log.entity_id) { <span style="color:var(--color-primary)">#{{ log.entity_id }}</span> }
                      </td>
                      <td style="font-size:12px;color:var(--color-on-surface-variant);font-family:monospace">{{ log.ip_address }}</td>
                    </tr>
                  }
                  @empty {
                    @if (!loading()) {
                      <tr><td colspan="5" style="text-align:center;padding:40px;color:var(--color-on-surface-variant)">No hay registros de auditoría.</td></tr>
                    }
                  }
                </tbody>
              </table>
            </div>
            <div style="padding:12px 20px;border-top:1px solid var(--color-outline-variant);display:flex;justify-content:space-between;align-items:center;background:var(--color-surface-container-low);font-size:12px;color:var(--color-on-surface-variant)">
              <span>{{ total() }} registros en total</span>
              <div style="display:flex;gap:4px">
                <button [disabled]="page() === 1" (click)="prevPage()" style="padding:4px 12px;border-radius:8px;border:1px solid var(--color-outline-variant);background:none;cursor:pointer">
                  ← Anterior
                </button>
                <button (click)="nextPage()" [disabled]="page() * 20 >= total()" style="padding:4px 12px;border-radius:8px;border:1px solid var(--color-outline-variant);background:none;cursor:pointer">
                  Siguiente →
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  `
})
export class AuditLogComponent implements OnInit {
  readonly loading = signal(true);
  readonly logs    = signal<AuditLog[]>([]);
  readonly total   = signal(0);
  readonly page    = signal(1);

  constructor(private readonly api: ApiService, readonly auth: AuthService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.getAuditLogs(this.page(), 20).subscribe({
      next: r => { this.logs.set(r.data?.records ?? []); this.total.set(r.data?.total ?? 0); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  prevPage(): void { this.page.update(p => Math.max(1, p-1)); this.load(); }
  nextPage(): void { this.page.update(p => p+1); this.load(); }
}
