import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    @if (initials) {
      <span class="avatar-initials">{{ initials }}</span>
    } @else {
      <span class="material-symbols-outlined avatar-icon">{{ icon }}</span>
    }
  `,
  styles: [
    `
      :host {
        align-items: center;
        background: var(--app-color-secondary-container);
        border-radius: var(--app-radius-pill);
        color: var(--app-color-secondary-container-text);
        display: inline-flex;
        flex-shrink: 0;
        justify-content: center;
        overflow: hidden;
      }

      :host([data-size='sm']) {
        height: 40px;
        width: 40px;
      }

      :host([data-size='md']) {
        height: 56px;
        width: 56px;
      }

      :host([data-size='lg']) {
        height: 96px;
        width: 96px;
      }

      .avatar-initials {
        font-weight: 700;
      }

      :host([data-size='sm']) .avatar-initials {
        font-size: 14px;
      }

      :host([data-size='md']) .avatar-initials {
        font-size: 18px;
      }

      :host([data-size='lg']) .avatar-initials {
        font-size: 32px;
      }

      .avatar-icon {
        font-variation-settings:
          'FILL' 1,
          'wght' 400,
          'GRAD' 0,
          'opsz' 24;
      }

      :host([data-size='sm']) .avatar-icon {
        font-size: 20px;
      }

      :host([data-size='md']) .avatar-icon {
        font-size: 28px;
      }

      :host([data-size='lg']) .avatar-icon {
        font-size: 48px;
      }
    `
  ],
  host: {
    '[attr.data-size]': 'size'
  }
})
export class AvatarComponent {
  @Input() name?: string | null;
  @Input() icon = 'person';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get initials(): string {
    if (!this.name) {
      return '';
    }

    const parts = this.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '';
    }

    const first = parts[0][0] ?? '';
    const second = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
    return (first + second).toUpperCase();
  }
}
