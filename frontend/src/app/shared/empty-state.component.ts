import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <section class="empty-state" aria-live="polite">
      <div class="empty-mark" aria-hidden="true">{{ icon }}</div>
      <h2>{{ title }}</h2>
      @if (message) {
        <p>{{ message }}</p>
      }
    </section>
  `,
  styles: [
    `
      .empty-state {
        align-items: center;
        background: var(--app-color-surface);
        border-radius: var(--app-radius-card);
        box-shadow: var(--app-shadow-card);
        color: var(--app-color-text);
        display: grid;
        gap: var(--app-space-xs);
        justify-items: center;
        padding: var(--app-space-lg);
        text-align: center;
      }

      .empty-mark {
        align-items: center;
        background: var(--app-color-surface-muted);
        border-radius: var(--app-radius-pill);
        color: var(--app-color-primary);
        display: inline-flex;
        font-size: 1.5rem;
        height: 56px;
        justify-content: center;
        width: 56px;
      }

      h2,
      p {
        margin: 0;
      }

      h2 {
        font-size: 1rem;
        font-weight: 700;
      }

      p {
        color: var(--app-color-text-muted);
        font-size: 0.875rem;
        line-height: 1.5;
      }
    `
  ]
})
export class EmptyStateComponent {
  @Input() title = 'لا توجد بيانات';
  @Input() message = '';
  @Input() icon = '•';
}
