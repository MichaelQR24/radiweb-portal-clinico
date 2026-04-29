import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { User } from '../../../core/models/models';

@Component({
    selector: 'app-user-list',
    imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatDialogModule, SidebarComponent, NavbarComponent],
    template: `
    <div class="rw-layout">
      <app-sidebar />
      <div class="rw-main">
        <app-navbar title="Gestión de Usuarios" />
        <main class="rw-content">
          <div class="rw-page-header">
            <h1>Gestión de Usuarios</h1>
            <p>Administre los usuarios del sistema RadiWeb.</p>
          </div>

          <section class="rw-card" style="overflow:hidden">
            <div style="padding:14px 20px;border-bottom:1px solid var(--color-outline-variant);display:flex;justify-content:space-between;align-items:center;background:var(--color-surface-container-low)">
              <div style="position:relative">
                <input class="rw-input" id="input-user-search" type="text" placeholder="Buscar usuarios..."
                  [value]="search()" (input)="onSearch($any($event.target).value)"
                  style="padding-left:36px;width:280px"/>
                <mat-icon style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:18px;width:18px;height:18px;color:var(--color-outline)">search</mat-icon>
              </div>
              <button class="rw-btn rw-btn--primary" id="btn-add-user" (click)="openForm()" style="padding:8px 16px;font-size:12px">
                <mat-icon style="font-size:16px;width:16px;height:16px">add</mat-icon>
                Agregar Usuario
              </button>
            </div>

            <div style="overflow-x:auto">
              <table class="rw-table">
                <thead>
                  <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Último Acceso</th><th style="text-align:right">Acciones</th></tr>
                </thead>
                <tbody>
                  @if (loading()) {
                    <tr><td colspan="6" style="text-align:center;padding:40px"><div class="rw-spinner" style="margin:0 auto"></div></td></tr>
                  }
                  @for (u of users(); track u.id) {
                    <tr>
                      <td style="font-weight:600">{{ u.name }}</td>
                      <td style="font-size:13px;color:var(--color-on-surface-variant)">{{ u.email }}</td>
                      <td>
                        <span style="padding:2px 8px;border-radius:4px;background:var(--color-surface-container);font-size:10px;font-weight:700;text-transform:capitalize">
                          {{ u.role }}
                        </span>
                      </td>
                      <td>
                        <span [style.background]="u.is_active ? 'var(--color-secondary-container)' : 'var(--color-surface-container-high)'"
                              [style.color]="u.is_active ? 'var(--color-on-secondary-container)' : 'var(--color-outline)'"
                              style="padding:2px 8px;border-radius:4px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.06em">
                          {{ u.is_active ? 'ACTIVO' : 'INACTIVO' }}
                        </span>
                      </td>
                      <td style="font-size:12px;color:var(--color-on-surface-variant)">
                        {{ u.last_login ? (u.last_login | date:'dd/MM/yyyy HH:mm') : 'Nunca' }}
                      </td>
                      <td style="text-align:right">
                        <div style="display:flex;justify-content:flex-end;gap:4px">
                          <button class="icon-btn" [id]="'btn-edit-' + u.id" title="Editar" (click)="openForm(u)"><mat-icon>edit</mat-icon></button>
                          <button class="icon-btn" [id]="'btn-toggle-' + u.id" [title]="u.is_active ? 'Desactivar' : 'Activar'" (click)="toggleUser(u)">
                            <mat-icon>{{ u.is_active ? 'toggle_on' : 'toggle_off' }}</mat-icon>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                  @empty {
                    @if (!loading()) {
                      <tr><td colspan="6" style="text-align:center;padding:40px;color:var(--color-on-surface-variant)">No se encontraron usuarios.</td></tr>
                    }
                  }
                </tbody>
              </table>
            </div>

            <div style="padding:12px 20px;border-top:1px solid var(--color-outline-variant);display:flex;justify-content:space-between;align-items:center;background:var(--color-surface-container-low);font-size:12px;color:var(--color-on-surface-variant)">
              <span>{{ total() }} usuarios en total</span>
              <div style="display:flex;gap:4px">
                <button [disabled]="page() === 1" (click)="prevPage()" style="width:32px;height:32px;border-radius:8px;border:1px solid var(--color-outline-variant);background:none;cursor:pointer;display:flex;align-items:center;justify-content:center">
                  <mat-icon style="font-size:16px;width:16px;height:16px">chevron_left</mat-icon>
                </button>
                <button (click)="nextPage()" [disabled]="page() * limit() >= total()" style="width:32px;height:32px;border-radius:8px;border:1px solid var(--color-outline-variant);background:none;cursor:pointer;display:flex;align-items:center;justify-content:center">
                  <mat-icon style="font-size:16px;width:16px;height:16px">chevron_right</mat-icon>
                </button>
              </div>
            </div>
          </section>

          <!-- Modal Form -->
          @if (showForm()) {
            <div class="modal-backdrop" (click)="closeForm()">
              <div class="modal-dialog" (click)="$event.stopPropagation()" id="user-form-modal">
                <div class="panel-header" style="padding:20px;border-bottom:1px solid var(--color-outline-variant)">
                  <h2 style="margin:0;font-size:18px;font-weight:700">{{ editUser() ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
                  <button style="background:none;border:none;cursor:pointer;color:var(--color-on-surface-variant)" (click)="closeForm()">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <div style="padding:24px" [formGroup]="userForm">
                  <div style="display:flex;flex-direction:column;gap:16px">
                    <div class="rw-form-field">
                      <label for="user-name">Nombre Completo</label>
                      <input id="user-name" formControlName="name" class="rw-input" placeholder="Dr. Juan García"/>
                    </div>
                    <div class="rw-form-field">
                      <label for="user-email">Email</label>
                      <input id="user-email" formControlName="email" type="email" class="rw-input" placeholder="usuario@diris.gob.pe"/>
                    </div>
                    @if (!editUser()) {
                      <div class="rw-form-field">
                        <label for="user-password">Contraseña</label>
                        <input id="user-password" formControlName="password" type="password" class="rw-input" placeholder="Mín. 8 caracteres"/>
                      </div>
                    }
                    <div class="rw-form-field">
                      <label for="user-role">Rol</label>
                      <select id="user-role" formControlName="role" class="rw-input">
                        <option value="">Seleccione un rol...</option>
                        <option value="tecnologo">Tecnólogo Médico</option>
                        <option value="radiologo">Médico Radiólogo</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  </div>
                  @if (formErrorMsg()) {
                    <div style="margin-top:12px;padding:10px;border-radius:8px;background:var(--color-error-container);color:var(--color-on-error-container);font-size:12px">{{ formErrorMsg() }}</div>
                  }
                  <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px">
                    <button class="rw-btn rw-btn--ghost" id="btn-cancel-user-form" (click)="closeForm()">Cancelar</button>
                    <button class="rw-btn rw-btn--primary" id="btn-save-user" (click)="saveUser()" [disabled]="formLoading() || userForm.invalid">
                      @if (formLoading()) { <span class="rw-spinner" style="width:16px;height:16px;border-width:2px"></span> }
                      @else { <mat-icon>save</mat-icon> }
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </main>
      </div>
    </div>
  `,
    styles: [`
    .icon-btn { padding:6px;border-radius:8px;background:none;border:none;cursor:pointer;color:var(--color-primary);transition:background .15s;&:hover{background:rgba(0,77,153,.1);} }
    .modal-backdrop { position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:100;display:flex;align-items:center;justify-content:center; }
    .modal-dialog { background:var(--color-surface-container-lowest);border-radius:16px;width:100%;max-width:480px;box-shadow:var(--shadow-xl); }
    .panel-header { display:flex;justify-content:space-between;align-items:center; }
  `]
})
export class UserListComponent implements OnInit {
  readonly loading     = signal(true);
  readonly users       = signal<User[]>([]);
  readonly total       = signal(0);
  readonly page        = signal(1);
  readonly limit       = signal(20);
  readonly search      = signal('');
  readonly showForm    = signal(false);
  readonly editUser    = signal<User | null>(null);
  readonly formLoading = signal(false);
  readonly formErrorMsg = signal('');

  readonly userForm = this.fb.nonNullable.group({
    name:     ['', [Validators.required, Validators.minLength(2)]],
    email:    ['', [Validators.required, Validators.email]],
    password: [''],
    role:     ['', Validators.required],
  });

  constructor(private readonly fb: FormBuilder, private readonly api: ApiService, readonly auth: AuthService) {}

  ngOnInit(): void { this.loadUsers(); }

  loadUsers(): void {
    this.loading.set(true);
    this.api.getUsers(this.page(), this.limit(), this.search()).subscribe({
      next: r => { this.users.set(r.data?.records ?? []); this.total.set(r.data?.total ?? 0); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSearch(val: string): void { this.search.set(val); this.page.set(1); this.loadUsers(); }
  prevPage(): void { this.page.update(p => Math.max(1, p-1)); this.loadUsers(); }
  nextPage(): void { this.page.update(p => p+1); this.loadUsers(); }

  openForm(user?: User): void {
    this.editUser.set(user ?? null);
    this.formErrorMsg.set('');
    if (user) {
      this.userForm.patchValue({ name: user.name, email: user.email, role: user.role });
      this.userForm.get('password')?.clearValidators();
    } else {
      this.userForm.reset();
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    }
    this.userForm.updateValueAndValidity();
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.editUser.set(null); }

  saveUser(): void {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    this.formLoading.set(true);
    const val = this.userForm.getRawValue();
    const editId = this.editUser()?.id;
    const req$ = editId ? this.api.updateUser(editId, { name: val.name, email: val.email, role: val.role } as any) : this.api.createUser(val);
    req$.subscribe({
      next: () => { this.formLoading.set(false); this.closeForm(); this.loadUsers(); },
      error: e => { this.formLoading.set(false); this.formErrorMsg.set(e?.error?.message ?? 'Error guardando usuario'); },
    });
  }

  toggleUser(user: User): void {
    this.api.toggleUser(user.id).subscribe({ next: () => this.loadUsers(), error: () => {} });
  }
}
