import { Component, Input } from '@angular/core';
import { IonSkeletonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [IonSkeletonText],
  template: `
    <div class="skeleton-list" aria-busy="true" aria-label="جاري التحميل">
      @for (item of rows; track item) {
        <article class="skeleton-card">
          <ion-skeleton-text animated class="line title" />
          <ion-skeleton-text animated class="line" />
          <ion-skeleton-text animated class="line short" />
        </article>
      }
    </div>
  `,
  styles: [
    `
      .skeleton-list {
        display: grid;
        gap: var(--app-space-sm);
      }

      .skeleton-card {
        background: var(--app-color-surface);
        border-radius: var(--app-radius-card);
        box-shadow: var(--app-shadow-card);
        display: grid;
        gap: var(--app-space-xs);
        padding: var(--app-space-sm);
      }

      .line {
        border-radius: var(--app-radius-pill);
        height: 14px;
        margin: 0;
      }

      .title {
        height: 20px;
        width: 62%;
      }

      .short {
        width: 38%;
      }
    `
  ]
})
export class LoadingSkeletonComponent {
  @Input() count = 2;

  get rows(): number[] {
    return Array.from({ length: this.count }, (_, index) => index);
  }
}
