import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudyStatus } from '../../../core/models/models';

@Component({
    selector: 'app-status-badge',
    imports: [CommonModule],
    template: `
    <span class="rw-badge rw-badge--{{ status }}">
      {{ statusLabel }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: StudyStatus;

  get statusLabel(): string {
    const labels: Record<StudyStatus, string> = {
      pendiente:    'Pendiente',
      enviado:      'Enviado',
      diagnosticado: 'Diagnosticado',
      rechazado:    'Rechazado',
    };
    return labels[this.status] ?? this.status;
  }
}
