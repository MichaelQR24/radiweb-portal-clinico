import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    imports: [CommonModule, ReactiveFormsModule, MatIconModule],
    template: `
    <div class="login-bg">
      <!-- Fondo abstracto decorativo -->
      <div class="login-blob login-blob--1"></div>
      <div class="login-blob login-blob--2"></div>

      <div class="login-card" id="login-form-card">
        <div class="login-left">
          <img src="assets/logo.png" alt="RadiWeb Logo" style="width:80px;height:80px;object-fit:contain;margin-bottom:16px;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.15)"/>
          <h1 class="login-title">RadiWeb</h1>
          <p class="login-subtitle">Plataforma Segura de Imagenología Médica</p>
        </div>

        <div class="login-form-card">
          <div class="login-top-accent"></div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
            <!-- Email -->
            <div class="rw-form-field">
              <label for="email">Correo Electrónico</label>
              <div style="position:relative">
                <mat-icon class="input-icon">email</mat-icon>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  class="rw-input input-with-icon"
                  placeholder="usuario@diris.gob.pe"
                  autocomplete="email"
                />
              </div>
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <span class="error-message">Ingrese un email válido</span>
              }
            </div>

            <!-- Contraseña -->
            <div class="rw-form-field">
              <label for="password">Contraseña</label>
              <div style="position:relative">
                <mat-icon class="input-icon">lock</mat-icon>
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  class="rw-input input-with-icon input-with-icon-right"
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="toggle-pass"
                  id="btn-toggle-password"
                  (click)="showPassword.set(!showPassword())"
                >
                  <mat-icon style="font-size:18px;width:18px;height:18px">{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <span class="error-message">La contraseña debe tener al menos 6 caracteres</span>
              }
            </div>

            @if (errorMsg()) {
              <div class="login-error" id="login-error-msg">
                <mat-icon style="font-size:16px;width:16px;height:16px">warning</mat-icon>
                {{ errorMsg() }}
              </div>
            }

            <button
              type="submit"
              class="rw-btn rw-btn--primary"
              id="btn-login-submit"
              style="width:100%;justify-content:center;margin-top:8px"
              [disabled]="loading() || form.invalid"
            >
              @if (loading()) {
                <span class="rw-spinner" style="width:18px;height:18px;border-width:2px"></span>
                Autenticando...
              } @else {
                <mat-icon>login</mat-icon>
                Iniciar Sesión
              }
            </button>
          </form>
        </div>

        <div class="login-footer">
          <div class="online-indicator">
            <div class="online-dot" style="width:8px;height:8px"></div>
            Sistema en Línea • v1.0.0
          </div>
        </div>

        <!-- Info de acceso demo -->
        <div class="demo-info">
          <p style="font-size:11px;font-weight:700;color:var(--color-on-surface-variant);opacity:.7;text-transform:uppercase;letter-spacing:.06em;margin:0 0 8px">Acceso Demo</p>
          <div class="demo-grid">
            @for (u of demoUsers; track u.email) {
              <button class="demo-btn" (click)="fillDemo(u.email, u.label)" [id]="'demo-' + u.role">
                <span class="demo-role">{{ u.label }}</span>
                <span class="demo-email">{{ u.email }}</span>
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .login-bg {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-surface);
      position: relative;
      overflow: hidden;
      padding: 24px;
    }
    .login-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: .12;
    }
    .login-blob--1 { top:-10%;left:-10%;width:40%;height:40%;background:var(--color-primary); }
    .login-blob--2 { bottom:-10%;right:-10%;width:50%;height:50%;background:var(--color-secondary-container); }

    .login-card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 420px;
      animation: fadeInUp .3s ease;
    }

    .login-header {
      text-align: center;
      margin-bottom: 24px;
    }
    .login-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: var(--color-primary);
      box-shadow: 0 8px 24px rgb(0 77 153 / .3);
      margin-bottom: 16px;
      transform: rotate(-6deg);
    }
    .login-title {
      font-size: 32px;
      font-weight: 900;
      color: var(--color-primary);
      letter-spacing: -0.03em;
      margin: 0 0 4px;
    }
    .login-subtitle {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-on-surface-variant);
      opacity: .65;
      margin: 0;
    }

    .login-form-card {
      background: var(--color-surface-container-lowest);
      border: 1px solid var(--color-outline-variant);
      border-radius: 16px;
      box-shadow: 0 20px 40px rgb(0 0 0 / .08);
      overflow: hidden;
      position: relative;
    }
    .login-top-accent {
      height: 4px;
      background: var(--color-primary);
    }

    .login-form {
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-outline);
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }
    .input-with-icon { padding-left: 40px !important; }
    .input-with-icon-right { padding-right: 44px !important; }
    .toggle-pass {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-outline);
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: 4px;
      &:hover { color: var(--color-on-surface); }
    }

    .login-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: var(--color-error-container);
      color: var(--color-on-error-container);
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
    }

    .login-footer {
      margin-top: 20px;
      text-align: center;
    }
    .online-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 9999px;
      background: var(--color-surface-container-high);
      border: 1px solid var(--color-outline-variant);
      font-size: 10px;
      font-weight: 700;
      color: var(--color-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: .08em;
    }

    .demo-info {
      margin-top: 20px;
      padding: 16px;
      border-radius: 12px;
      background: var(--color-surface-container-low);
      border: 1px solid var(--color-outline-variant);
    }
    .demo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }
    .demo-btn {
      display: flex;
      flex-direction: column;
      padding: 10px;
      border-radius: 8px;
      background: var(--color-surface-container-lowest);
      border: 1px solid var(--color-outline-variant);
      cursor: pointer;
      transition: all .15s;
      &:hover { border-color: var(--color-primary); background: var(--color-primary-container)/10; }
    }
    .demo-role {
      font-size: 10px;
      font-weight: 700;
      color: var(--color-primary);
      text-transform: uppercase;
      letter-spacing: .06em;
    }
    .demo-email {
      font-size: 9px;
      color: var(--color-on-surface-variant);
      opacity: .7;
      margin-top: 2px;
    }
  `]
})
export class LoginComponent implements OnInit {
  readonly showPassword = signal(false);
  readonly loading      = signal(false);
  readonly errorMsg     = signal('');

  readonly demoUsers = [
    { role: 'tecnologo', label: 'Tecnólogo', email: 'tecnologo@radiweb.pe' },
    { role: 'radiologo', label: 'Radiólogo', email: 'radiologo@radiweb.pe' },
    { role: 'admin',     label: 'Admin',     email: 'admin@radiweb.pe' },
  ];

  readonly form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    // Si ya está autenticado, redirigir al dashboard
    if (this.auth.isLoggedIn()) {
      const role = this.auth.currentRole();
      if (role) this.auth.redirectToDashboard(role);
    }
  }

  fillDemo(email: string, _label: string): void {
    this.form.patchValue({ email, password: 'demo123' });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.errorMsg.set('');

    const { email, password } = this.form.getRawValue();

    this.auth.login({ email, password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.auth.redirectToDashboard(res.data.user.role);
        }
      },
      error: (err) => {
        this.loading.set(false);
        const msg = (err?.error?.message as string | undefined) ?? 'Error de autenticación. Intente nuevamente.';
        this.errorMsg.set(msg);
      },
    });
  }
}
