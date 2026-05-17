import { Component, Input, Output, EventEmitter, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-navbar',
    imports: [CommonModule, MatIconModule],
    template: `
    <header class="rw-topbar">
      <div style="display:flex;align-items:center;gap:12px">
        <span class="topbar-title">{{ title }}</span>
        @if (auth.currentRole() === 'admin') {
          <span style="padding:2px 10px;border-radius:9999px;background:var(--color-secondary-container);color:var(--color-on-secondary-container);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Admin</span>
        }
      </div>

      <div class="topbar-right">
        <!-- Privacy Mode Toggle -->
        <button
          id="btn-privacy-mode"
          (click)="privacyModeChange.emit(!privacyMode)"
          [style]="privacyMode
            ? 'display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:9999px;background:#fff3e0;border:1px solid #ffb300;cursor:pointer;font-size:11px;font-weight:700;color:#e65100;text-transform:uppercase;letter-spacing:.06em;transition:all .2s'
            : 'display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:9999px;background:var(--color-surface-container);border:1px solid var(--color-outline-variant);cursor:pointer;font-size:11px;font-weight:700;color:var(--color-on-surface-variant);text-transform:uppercase;letter-spacing:.06em;transition:all .2s'"
        >
          <mat-icon style="font-size:16px;width:16px;height:16px">{{ privacyMode ? 'visibility_off' : 'visibility' }}</mat-icon>
          Privacy Mode
        </button>

        <div style="width:1px;height:24px;background:var(--color-outline-variant)"></div>

        <!-- Campana de Notificaciones -->
        <div class="notif-wrapper">
          <button id="btn-notifications" class="notif-bell" (click)="toggleDropdown()" title="Notificaciones">
            <mat-icon>notifications</mat-icon>
            @if (notifSvc.unreadCount() > 0) {
              <span class="notif-badge">{{ notifSvc.unreadCount() }}</span>
            }
          </button>

          @if (dropdownOpen()) {
            <div class="notif-dropdown">
              <div class="notif-header">
                <span>Notificaciones</span>
                <span class="notif-count-label">{{ notifSvc.unreadCount() }} sin leer</span>
              </div>

              @if (notifSvc.notifications().length === 0) {
                <div class="notif-empty">
                  <mat-icon style="font-size:32px;width:32px;height:32px;opacity:.3">notifications_none</mat-icon>
                  <p>Sin notificaciones nuevas</p>
                </div>
              } @else {
                <ul class="notif-list">
                  @for (n of notifSvc.notifications(); track n.id) {
                    <li class="notif-item" (click)="readAndClose(n.id)">
                      <div class="notif-dot"></div>
                      <div class="notif-content">
                        <p class="notif-msg">{{ n.message }}</p>
                        <span class="notif-time">{{ n.created_at | date:'dd/MM HH:mm' }}</span>
                      </div>
                      <mat-icon class="notif-check" title="Marcar como leída">check_circle</mat-icon>
                    </li>
                  }
                </ul>
              }
            </div>
          }
        </div>

        <div style="display:flex;align-items:center;gap:8px">
          <div style="text-align:right">
            <div style="font-size:12px;font-weight:600;color:var(--color-on-surface);text-transform:capitalize">
              {{ auth.currentUser()?.name ?? auth.currentRole() }}
            </div>
            <div style="display:flex;align-items:center;gap:4px;justify-content:flex-end">
              <div class="online-dot"></div>
              <span style="font-size:10px;color:var(--color-on-surface-variant)">En línea</span>
            </div>
          </div>

          <div class="user-avatar">
            {{ (auth.currentUser()?.name ?? 'U').charAt(0).toUpperCase() }}
          </div>

          <button
            id="btn-logout"
            (click)="auth.logout()"
            style="padding:6px;border-radius:8px;background:none;border:none;cursor:pointer;color:var(--color-on-surface-variant);display:flex;align-items:center;transition:all .15s"
            title="Cerrar sesión"
          >
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </div>
    </header>
  `,
    styles: [`
    .notif-wrapper { position: relative; }
    .notif-bell {
      position: relative;
      width: 38px; height: 38px;
      border-radius: 50%;
      background: none;
      border: 1px solid var(--color-outline-variant);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--color-on-surface-variant);
      transition: background .15s, color .15s;
      &:hover { background: var(--color-surface-container); color: var(--color-on-surface); }
    }
    .notif-badge {
      position: absolute; top: -4px; right: -4px;
      min-width: 18px; height: 18px;
      padding: 0 4px; border-radius: 9999px;
      background: #d32f2f; color: white;
      font-size: 10px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid var(--color-surface);
      animation: pop-in .2s ease-out;
    }
    @keyframes pop-in { from { transform: scale(0); } to { transform: scale(1); } }
    .notif-dropdown {
      position: absolute; top: calc(100% + 10px); right: 0;
      width: 340px;
      background: var(--color-surface-container-lowest);
      border: 1px solid var(--color-outline-variant);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,.18);
      z-index: 200; overflow: hidden;
      animation: slide-down .15s ease-out;
    }
    @keyframes slide-down { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
    .notif-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-outline-variant);
      font-size: 13px; font-weight: 700; color: var(--color-on-surface);
    }
    .notif-count-label { font-size: 11px; font-weight: 600; color: var(--color-primary); }
    .notif-empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 8px; padding: 32px 16px;
      color: var(--color-on-surface-variant); font-size: 12px;
    }
    .notif-list { list-style: none; margin: 0; padding: 0; max-height: 320px; overflow-y: auto; }
    .notif-item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px 16px; cursor: pointer;
      border-bottom: 1px solid var(--color-outline-variant);
      transition: background .12s;
      &:last-child { border-bottom: none; }
      &:hover { background: var(--color-surface-container-low); }
      &:hover .notif-check { opacity: 1; }
    }
    .notif-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--color-primary); flex-shrink: 0; margin-top: 5px;
    }
    .notif-content { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .notif-msg { margin: 0; font-size: 12px; color: var(--color-on-surface); line-height: 1.4; }
    .notif-time { font-size: 10px; color: var(--color-on-surface-variant); opacity: .6; }
    .notif-check {
      font-size: 18px; width: 18px; height: 18px;
      color: var(--color-primary); opacity: 0; transition: opacity .15s; flex-shrink: 0;
    }
  `]
})
export class NavbarComponent {
  @Input() title = 'RadiWeb';
  @Input() privacyMode = false;
  @Output() privacyModeChange = new EventEmitter<boolean>();

  readonly dropdownOpen = signal(false);

  constructor(
    readonly auth: AuthService,
    readonly notifSvc: NotificationService,
  ) {}

  toggleDropdown(): void {
    this.dropdownOpen.update((v) => !v);
  }

  readAndClose(id: number): void {
    this.notifSvc.markAsRead(id);
    if (this.notifSvc.unreadCount() <= 1) {
      this.dropdownOpen.set(false);
    }
  }

  /** Cierra el dropdown al hacer click fuera del componente */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notif-wrapper')) {
      this.dropdownOpen.set(false);
    }
  }
}
