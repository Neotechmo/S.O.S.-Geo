import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-alert-toast',
  template: `
    <section class="toast-stack" aria-label="Notificaciones">
      @for (toast of service.notifications(); track toast.id) {
        <div class="toast" [class.toast-error]="toast.type === 'error'">
          <p [attr.role]="toast.type === 'error' ? 'alert' : 'status'">
            {{ toast.message }}
          </p>
          <button type="button" aria-label="Cerrar notificación" (click)="service.dismiss(toast.id)">×</button>
        </div>
      }
    </section>
  `,
})
export class AlertToastComponent {
  protected readonly service = inject(NotificationService);
}
