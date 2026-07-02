import { Component, Input } from '@angular/core';

export type AppStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed' | 'expired' | 'open' | 'started';

const STATUS_LABELS: Record<AppStatus, string> = {
  pending: 'بانتظار الموافقة',
  accepted: 'مقبول',
  rejected: 'مرفوض',
  cancelled: 'ملغي',
  completed: 'مكتمل',
  expired: 'منتهي',
  open: 'متاح',
  started: 'بدأت'
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: '<span class="status-badge" [attr.data-status]="tone">{{ labelText }}</span>',
  styles: [
    `
      :host {
        display: inline-flex;
      }

      .status-badge {
        align-items: center;
        border-radius: var(--app-radius-pill);
        display: inline-flex;
        font-size: 0.75rem;
        font-weight: 700;
        min-height: 28px;
        padding: 4px 10px;
        white-space: nowrap;
      }

      .status-badge[data-status='pending'] {
        background: var(--app-color-pending-bg);
        color: var(--app-color-pending);
      }

      .status-badge[data-status='accepted'] {
        background: var(--app-color-accepted-bg);
        color: var(--app-color-accepted);
      }

      .status-badge[data-status='rejected'] {
        background: var(--app-color-rejected-bg);
        color: var(--app-color-rejected);
      }

      .status-badge[data-status='completed'] {
        background: var(--app-color-completed-bg);
        color: var(--app-color-completed);
      }
    `
  ]
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: AppStatus;
  @Input() label?: string;

  get labelText(): string {
    return this.label || STATUS_LABELS[this.status] || this.status;
  }

  get tone(): 'pending' | 'accepted' | 'rejected' | 'completed' {
    if (this.status === 'accepted' || this.status === 'open' || this.status === 'started') {
      return 'accepted';
    }

    if (this.status === 'rejected' || this.status === 'cancelled' || this.status === 'expired') {
      return 'rejected';
    }

    if (this.status === 'completed') {
      return 'completed';
    }

    return 'pending';
  }
}
