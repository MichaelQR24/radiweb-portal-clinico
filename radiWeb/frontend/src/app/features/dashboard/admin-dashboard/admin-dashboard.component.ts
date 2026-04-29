import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { User, AuditLog } from '../../../core/models/models';

@Component({
    selector: 'app-admin-dashboard',
    imports: [CommonModule, RouterLink, MatIconModule, SidebarComponent, NavbarComponent],
    template: `
    <div class="rw-layout">
      <app-sidebar />
      <div class="rw-main">
        <app-navbar title="Panel de Control Admin" />
        <main class="rw-content">
          <div class="rw-page-header">
            <h1>Panel de Administración</h1>
            <p>Gestión del sistema RadiWeb – DIRIS Lima Centro.</p>
          </div>

          <!-- Metrics -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:32px">
            @for (m of metrics; track m.label; let i = $index) {
              <div class="rw-stat-card" [id]="'metric-' + m.key" [style.animation-delay]="(i*0.05)+'s'" [style.background]="m.safe ? 'rgba(34,197,94,.05)' : undefined">
                <div style="display:flex;justify-content:space-between">
                  <span class="stat-label">{{ m.label }}</span>
                  <mat-icon [style.color]="m.iconColor">{{ m.icon }}</mat-icon>
                </div>
                <div style="font-size:32px;font-weight:900" [style.color]="m.safe ? '#16a34a' : 'var(--color-on-surface)'">{{ m.value }}</div>
                <div style="font-size:10px;font-weight:700;color:var(--color-outline)">{{ m.sub }}</div>
              </div>
            }
          </div>

          <div style="display:grid;grid-template-columns:2fr 1fr;gap:24px">
            <!-- Users Table -->
            <section class="rw-card" style="overflow:hidden">
              <div style="padding:14px 20px;border-bottom:1px solid var(--color-outline-variant);display:flex;justify-content:space-between;align-items:center;background:var(--color-surface-container-low)">
                <h2 style="font-size:16px;font-weight:700;margin:0">Gestión de Usuarios</h2>
                <a routerLink="/admin/users" class="rw-btn rw-btn--primary" id="btn-manage-users" style="padding:8px 14px;font-size:12px;text-decoration:none">
                  <mat-icon style="font-size:16px;width:16px;height:16px">add</mat-icon>
                  Gestionar
                </a>
              </div>
              <table class="rw-table">
                <thead><tr><th>Nombre</th><th>Rol</th><th>Estado</th><th>Último Acceso</th></tr></thead>
                <tbody>
                  @if (loadingUsers()) {
                    <tr><td colspan="4" style="text-align:center;padding:32px"><div class="rw-spinner" style="margin:0 auto"></div></td></tr>
                  }
                  @for (u of users(); track u.id) {
                    <tr>
                      <td style="font-weight:600">{{ u.name }}</td>
                      <td style="font-size:12px;color:var(--color-on-surface-variant)">{{ u.role }}</td>
                      <td>
                        <span [style.background]="u.is_active ? 'var(--color-secondary-container)' : 'var(--color-surface-container-high)'"
                              [style.color]="u.is_active ? 'var(--color-on-secondary-container)' : 'var(--color-outline)'"
                              style="padding:2px 8px;border-radius:4px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.06em">
                          {{ u.is_active ? 'ACTIVO' : 'INACTIVO' }}
                        </span>
                      </td>
                      <td style="font-size:12px;color:var(--color-on-surface-variant)">
                        {{ u.last_login ? (u.last_login | date:'dd/MM HH:mm') : 'Nunca' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </section>

            <!-- Audit Log -->
            <section class="rw-card">
              <div style="padding:14px 20px;border-bottom:1px solid var(--color-outline-variant);background:var(--color-surface-container-low)">
                <h2 style="font-size:16px;font-weight:700;margin:0">Auditoría Reciente</h2>
              </div>
              <div style="padding:20px;display:flex;flex-direction:column;gap:20px">
                @for (log of auditLogs(); track log.id; let last = $last) {
                  <div style="display:flex;gap:12px">
                    <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                      <div style="width:8px;height:8px;border-radius:50%;background:var(--color-primary);box-shadow:0 0 0 3px rgb(0 77 153/.1);margin-top:4px"></div>
                      @if (!last) { <div style="width:1px;flex:1;background:var(--color-outline-variant)"></div> }
                    </div>
                    <div style="padding-bottom:12px">
                      <p style="margin:0;font-size:13px;color:var(--color-on-surface)">
                        <strong>{{ log.user_name }}</strong> {{ log.action }}
                      </p>
                      <p style="margin:4px 0 0;font-size:10px;font-weight:700;color:var(--color-on-surface-variant);opacity:.6;text-transform:uppercase;letter-spacing:.06em">
                        {{ log.timestamp | date:'dd/MM HH:mm' }}
                      </p>
                    </div>
                  </div>
                }
                @empty {
                  <p style="text-align:center;color:var(--color-on-surface-variant);font-size:13px">Sin actividad reciente.</p>
                }
              </div>
              <div style="padding:12px 20px;border-top:1px solid var(--color-outline-variant);text-align:center">
                <a routerLink="/admin/audit" style="font-size:12px;font-weight:700;color:var(--color-primary);text-decoration:none" id="link-full-audit">
                  Ver log completo →
                </a>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  `,
    styles: [`.stat-label { font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--color-on-surface-variant);opacity:.7; }`]
})
export class AdminDashboardComponent implements OnInit {
  readonly loadingUsers = signal(true);
  readonly users        = signal<User[]>([]);
  readonly auditLogs    = signal<AuditLog[]>([]);

  readonly metrics = [
    { key: 'uptime',   label: 'Uptime',           value: '99.9%',  sub: 'Últimos 30 días',  icon: 'storage',         iconColor: 'var(--color-primary)',   safe: false },
    { key: 'studies',  label: 'Estudios Totales',  value: '14,208', sub: '+12% este mes',    icon: 'analytics',       iconColor: 'var(--color-primary)',   safe: false },
    { key: 'users',    label: 'Usuarios Activos',  value: '—',      sub: 'En el sistema',    icon: 'group',           iconColor: 'var(--color-secondary)', safe: false },
    { key: 'alerts',   label: 'Alertas Seguridad', value: '0',      sub: 'Sistemas estables', icon: 'shield',         iconColor: 'var(--color-error)',     safe: true  },
  ];

  constructor(private readonly api: ApiService, readonly auth: AuthService) {}

  ngOnInit(): void {
    this.api.getUsers(1, 5).subscribe({
      next: r => {
        const data = r.data;
        this.users.set(data?.records ?? []);
        const usersMetric = this.metrics.find(m => m.key === 'users');
        if (usersMetric && data) usersMetric.value = data.total.toString();
        this.loadingUsers.set(false);
      },
      error: () => this.loadingUsers.set(false),
    });
    this.api.getAuditLogs(1, 5).subscribe({
      next: r => this.auditLogs.set(r.data?.records ?? []),
      error: () => {},
    });
  }
}
