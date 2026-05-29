import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { Notification } from '../../core/models/models';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule, MatIconModule, SidebarComponent, NavbarComponent],
  template: `
    <div class="rw-layout">
      <app-sidebar />
      <div class="rw-main">
        <app-navbar title="Notificaciones" />
        
        <main class="rw-content">
          <div class="notifications-container">
            <!-- Header -->
            <div class="page-header">
              <div>
                <h1>Centro de Notificaciones</h1>
                <p>Manténgase al tanto del flujo clínico de imagenología.</p>
              </div>
              @if (notifSvc.unreadCount() > 0) {
                <button class="rw-btn rw-btn--primary" id="btn-mark-all" (click)="notifSvc.markAllAsRead()">
                  <mat-icon>done_all</mat-icon>
                  Marcar todas como leídas
                </button>
              }
            </div>

            <!-- Listado de Notificaciones -->
            <div class="rw-card">
              <!-- No Leídas -->
              <section class="section-container">
                <h2 class="section-title">
                  <span class="dot unread"></span>
                  Bandeja de Entrada — Sin Leer ({{ unreadList().length }})
                </h2>
                
                <div class="notif-list">
                  @for (n of unreadList(); track n.id) {
                    <div class="notif-row unread" (click)="navigateAndRead(n)">
                      <mat-icon class="notif-icon">{{ getIcon(n.message) }}</mat-icon>
                      <div class="notif-details">
                        <p class="notif-text">{{ n.message }}</p>
                        <div class="notif-meta">
                          <span class="notif-time" [title]="n.created_at | date:'dd/MM/yyyy HH:mm:ss'">
                            {{ getRelativeTime(n.created_at) }}
                          </span>
                          @if (auth.currentRole() === 'admin') {
                            <span class="admin-badge">
                              <mat-icon style="font-size:10px;width:10px;height:10px">person</mat-icon>
                              Para: {{ n.recipient_name }}
                            </span>
                          }
                        </div>
                      </div>
                      <button class="action-btn" title="Marcar como leída" (click)="markSingle($event, n.id)">
                        <mat-icon>check_circle</mat-icon>
                      </button>
                    </div>
                  }
                  @empty {
                    <div class="empty-state">
                      <mat-icon style="font-size:40px;width:40px;height:40px">done_all</mat-icon>
                      <p>No tienes notificaciones sin leer.</p>
                    </div>
                  }
                </div>
              </section>

              <!-- Leídas -->
              <section class="section-container border-top">
                <h2 class="section-title">
                  <span class="dot read"></span>
                  Historial — Leídas ({{ readList().length }})
                </h2>
                
                <div class="notif-list">
                  @for (n of readList(); track n.id) {
                    <div class="notif-row read" (click)="navigateAndRead(n)">
                      <mat-icon class="notif-icon read-icon">{{ getIcon(n.message) }}</mat-icon>
                      <div class="notif-details">
                        <p class="notif-text">{{ n.message }}</p>
                        <div class="notif-meta">
                          <span class="notif-time" [title]="n.created_at | date:'dd/MM/yyyy HH:mm:ss'">
                            {{ getRelativeTime(n.created_at) }}
                          </span>
                          @if (auth.currentRole() === 'admin') {
                            <span class="admin-badge">
                              <mat-icon style="font-size:10px;width:10px;height:10px">person</mat-icon>
                              Para: {{ n.recipient_name }}
                            </span>
                          }
                        </div>
                      </div>
                    </div>
                  }
                  @empty {
                    <div class="empty-state">
                      <mat-icon style="font-size:40px;width:40px;height:40px">history</mat-icon>
                      <p>No hay historial de notificaciones leídas.</p>
                    </div>
                  }
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      max-width: 960px;
      margin: 0 auto;
      padding: 12px 0;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      h1 { margin: 0; font-size: 24px; font-weight: 800; color: var(--color-on-surface); }
      p { margin: 4px 0 0; font-size: 13px; color: var(--color-on-surface-variant); }
    }
    .section-container {
      padding: 24px;
    }
    .section-container.border-top {
      border-top: 1px solid var(--color-outline-variant);
    }
    .section-title {
      margin: 0 0 16px;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: var(--color-on-surface);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }
    .dot.unread { background: var(--color-primary); }
    .dot.read { background: var(--color-outline); }

    .notif-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .notif-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      border-radius: 10px;
      border: 1px solid var(--color-outline-variant);
      transition: all .15s ease;
      cursor: pointer;
    }
    .notif-row.unread {
      background: rgba(0, 77, 153, 0.03);
      border-left: 4px solid var(--color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
      &:hover {
        background: rgba(0, 77, 153, 0.06);
        transform: translateY(-1px);
      }
    }
    .notif-row.read {
      background: var(--color-surface-container-lowest);
      opacity: 0.85;
      &:hover {
        background: var(--color-surface-container-low);
      }
    }
    .notif-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: var(--color-primary);
      flex-shrink: 0;
    }
    .notif-icon.read-icon {
      color: var(--color-outline);
    }
    .notif-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .notif-text {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-on-surface);
      line-height: 1.5;
    }
    .notif-meta {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .notif-time {
      font-size: 11px;
      color: var(--color-on-surface-variant);
      opacity: 0.7;
      cursor: help;
    }
    .admin-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      font-weight: 700;
      background: var(--color-surface-container-high);
      color: var(--color-on-surface-variant);
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: .06em;
    }
    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-primary);
      padding: 6px;
      border-radius: 50%;
      transition: background .15s;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      &:hover {
        background: rgba(0, 77, 153, 0.08);
      }
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
    .empty-state {
      padding: 40px 16px;
      text-align: center;
      color: var(--color-on-surface-variant);
      opacity: 0.5;
      font-size: 13px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
  `]
})
export class NotificationsComponent {
  readonly unreadList = computed(() =>
    this.notifSvc.notifications().filter((n) => !n.is_read)
  );

  readonly readList = computed(() =>
    this.notifSvc.notifications().filter((n) => !!n.is_read)
  );

  constructor(
    readonly notifSvc: NotificationService,
    readonly auth: AuthService,
    private readonly router: Router
  ) {}

  getIcon(message: string): string {
    if (message.includes('diagnosticado')) return 'verified';
    if (message.includes('enviado')) return 'send';
    return 'notifications';
  }

  getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);

    if (diffMins < 1) return 'hace un momento';
    if (diffMins < 60) return `hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `hace ${diffDays} d`;
  }

  markSingle(event: Event, id: number): void {
    event.stopPropagation(); // Evita navegar al estudio al marcar como leída
    this.notifSvc.markAsRead(id);
  }

  navigateAndRead(n: Notification): void {
    if (!n.is_read) {
      this.notifSvc.markAsRead(n.id);
    }
    if (n.study_id) {
      void this.router.navigate(['/viewer', n.study_id]);
    }
  }
}
