import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/models';

/**
 * Guard RBAC que verifica el rol del usuario contra los roles permitidos en la ruta.
 * Requiere que la ruta tenga `data: { roles: UserRole[] }` configurado.
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as UserRole[] | undefined;
  const userRole     = auth.currentRole();

  if (!userRole) {
    return router.createUrlTree(['/login']);
  }

  if (!allowedRoles || allowedRoles.includes(userRole)) {
    return true;
  }

  // Redirigir al dashboard del rol actual si no tiene acceso
  const dashboardMap: Record<UserRole, string> = {
    tecnologo: '/dashboard/tecnologo',
    radiologo: '/dashboard/radiologo',
    admin:     '/dashboard/admin',
  };

  return router.createUrlTree([dashboardMap[userRole]]);
};
