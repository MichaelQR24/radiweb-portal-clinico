import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor que maneja errores HTTP globalmente:
 * - 401: redirige al login (sesión expirada)
 * - 403: muestra mensaje de acceso denegado
 * - 500: muestra mensaje de error del servidor
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const router = inject(Router);
  const auth   = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          // Si el 401 es en el endpoint de logout, evitamos llamar a auth.logout() otra vez (bucle infinito)
          if (req.url.includes('/api/auth/logout')) {
            localStorage.removeItem('radiweb_token');
            localStorage.removeItem('radiweb_user');
            void router.navigate(['/login']);
          } else {
            // Token expirado o inválido: cerrar sesión
            auth.logout();
          }
          break;
        case 403:
          // Acceso denegado: redirigir al dashboard
          void router.navigate(['/']);
          break;
        case 0:
          // Sin conexión al servidor
          console.error('No se pudo conectar con el servidor. Verifique que el backend esté corriendo.');
          break;
      }
      return throwError(() => error);
    })
  );
};
