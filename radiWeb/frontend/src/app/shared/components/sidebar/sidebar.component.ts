import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/models';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: UserRole[];
}

@Component({
    selector: 'app-sidebar',
    imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
    template: `
    <nav class="rw-sidebar">
      <div class="sidebar-header">
        <div class="brand">
          <img src="assets/logo.png" alt="RadiWeb Logo" style="width:32px;height:32px;object-fit:contain;border-radius:8px"/>
          <div class="brand-name">RadiWeb</div>
          <div class="brand-sub">Clinical Portal</div>
        </div>
      </div>

      <div class="nav-items">
        @for (item of visibleItems(); track item.route) {
          <button
            class="nav-item"
            [class.active]="isActive(item.route)"
            [routerLink]="item.route"
            [id]="'nav-' + item.label.toLowerCase().replace(' ', '-')"
          >
            <mat-icon>{{ item.icon }}</mat-icon>
            {{ item.label }}
          </button>
        }
      </div>

      <div class="nav-footer">
        <button class="nav-item" id="nav-logout" (click)="logout()">
          <mat-icon>logout</mat-icon>
          Cerrar Sesión
        </button>
      </div>
    </nav>
  `
})
export class SidebarComponent {
  private readonly navItems: NavItem[] = [
    { label: 'Dashboard',      icon: 'dashboard',      route: '/dashboard/tecnologo', roles: ['tecnologo'] },
    { label: 'Cola de Trabajo', icon: 'list_alt',      route: '/dashboard/radiologo', roles: ['radiologo'] },
    { label: 'Panel Admin',    icon: 'admin_panel_settings', route: '/dashboard/admin', roles: ['admin'] },
    { label: 'Nuevo Estudio',  icon: 'add_circle',     route: '/studies/new',         roles: ['tecnologo'] },
    { label: 'Gestión Usuarios', icon: 'group',        route: '/admin/users',         roles: ['admin'] },
    { label: 'Auditoría',      icon: 'history',        route: '/admin/audit',         roles: ['admin'] },
  ];

  readonly visibleItems = computed(() => {
    const role = this.auth.currentRole();
    return this.navItems.filter(i => !role || i.roles.includes(role));
  });

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  logout(): void {
    this.auth.logout();
  }
}
