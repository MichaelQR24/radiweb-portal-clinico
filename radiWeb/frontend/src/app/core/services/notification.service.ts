import { Injectable, OnDestroy, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse, Notification } from '../models/models';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private readonly base = `${environment.apiUrl}/notifications`;

  /** Lista reactiva de notificaciones no leídas */
  readonly notifications = signal<Notification[]>([]);

  /** Cantidad de no leídas como computed para el badge */
  readonly unreadCount = computed(() => this.notifications().length);

  private pollingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly http: HttpClient) {}

  /**
   * Inicia el polling cada 60 segundos.
   * Llamar desde el componente principal al iniciar sesión.
   */
  startPolling(): void {
    this.fetchNotifications(); // Primera carga inmediata
    this.pollingTimer = setInterval(() => this.fetchNotifications(), 60_000);
  }

  /** Detiene el polling. Llamar al hacer logout o al destruir el servicio. */
  stopPolling(): void {
    if (this.pollingTimer !== null) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.notifications.set([]);
  }

  /** Llama al endpoint y actualiza el signal. */
  private fetchNotifications(): void {
    this.http.get<ApiResponse<Notification[]>>(this.base).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.notifications.set(res.data);
        }
      },
      error: () => {
        // Silencioso: el polling no debe mostrar errores al usuario
      },
    });
  }

  /** Marca una notificación como leída y la elimina del signal local. */
  markAsRead(id: number): void {
    this.http.patch<ApiResponse<{ id: number }>>(`${this.base}/${id}/read`, {}).subscribe({
      next: () => {
        // Optimistic update: quitar del array sin esperar otro poll
        this.notifications.update((list) => list.filter((n) => n.id !== id));
      },
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
