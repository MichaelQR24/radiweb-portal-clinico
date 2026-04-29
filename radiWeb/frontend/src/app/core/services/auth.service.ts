import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, LoginRequest, LoginResponse, User, UserRole } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'radiweb_token';
  private readonly USER_KEY  = 'radiweb_user';

  // Estado reactivo con signals (Angular 17+)
  private _currentUser = signal<User | null>(this.loadStoredUser());
  private _token       = signal<string | null>(this.loadStoredToken());

  readonly currentUser  = this._currentUser.asReadonly();
  readonly isLoggedIn   = computed(() => !!this._token() && !!this._currentUser());
  readonly currentRole  = computed(() => this._currentUser()?.role ?? null);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  /**
   * Realiza el login y guarda el token JWT en localStorage.
   */
  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.storeSession(response.data.accessToken, response.data.user);
          }
        }),
        catchError(err => throwError(() => err))
      );
  }

  /**
   * Cierra sesión y redirige al login.
   */
  logout(): void {
    this.clearSession();
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => void this.router.navigate(['/login'])
    });
  }

  /**
   * Obtiene el token de acceso almacenado.
   */
  getToken(): string | null {
    return this._token();
  }

  /**
   * Obtiene el perfil del usuario actual desde el servidor.
   */
  getProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${environment.apiUrl}/auth/me`);
  }

  /**
   * Redirige al dashboard correspondiente al rol del usuario.
   */
  redirectToDashboard(role: UserRole): void {
    const routes: Record<UserRole, string> = {
      tecnologo: '/dashboard/tecnologo',
      radiologo: '/dashboard/radiologo',
      admin:     '/dashboard/admin',
    };
    void this.router.navigate([routes[role]]);
  }

  private storeSession(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this._token.set(token);
    this._currentUser.set(user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._token.set(null);
    this._currentUser.set(null);
  }

  private loadStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private loadStoredUser(): User | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (!stored) return null;
    try { return JSON.parse(stored) as User; } catch { return null; }
  }
}
