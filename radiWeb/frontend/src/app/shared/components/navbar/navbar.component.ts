import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

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
          style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:9999px;background:var(--color-surface-container);border:1px solid var(--color-outline-variant);cursor:pointer;font-size:11px;font-weight:700;color:var(--color-on-surface-variant);text-transform:uppercase;letter-spacing:.06em"
        >
          <mat-icon style="font-size:16px;width:16px;height:16px">{{ privacyMode ? 'visibility_off' : 'visibility' }}</mat-icon>
          Privacy Mode
        </button>

        <div style="width:1px;height:24px;background:var(--color-outline-variant)"></div>

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
  `
})
export class NavbarComponent {
  @Input() title = 'RadiWeb';
  @Input() privacyMode = false;
  @Output() privacyModeChange = new EventEmitter<boolean>();

  constructor(readonly auth: AuthService) {}
}
