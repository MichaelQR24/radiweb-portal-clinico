import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'dashboard/tecnologo',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['tecnologo'] },
    loadComponent: () => import('./features/dashboard/tecnologo-dashboard/tecnologo-dashboard.component').then(m => m.TecnologoDashboardComponent),
  },
  {
    path: 'dashboard/radiologo',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['radiologo'] },
    loadComponent: () => import('./features/dashboard/radiologo-dashboard/radiologo-dashboard.component').then(m => m.RadiologoDashboardComponent),
  },
  {
    path: 'dashboard/admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./features/dashboard/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
  },
  {
    path: 'studies/new',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['tecnologo'] },
    loadComponent: () => import('./features/studies/study-new/study-new.component').then(m => m.StudyNewComponent),
  },
  {
    path: 'viewer/:studyId',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['radiologo', 'admin'] },
    loadComponent: () => import('./features/viewer/viewer.component').then(m => m.ViewerComponent),
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./features/admin/user-list/user-list.component').then(m => m.UserListComponent),
  },
  {
    path: 'admin/audit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./features/admin/audit-log/audit-log.component').then(m => m.AuditLogComponent),
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
