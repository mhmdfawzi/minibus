import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  template: `
    <div class="star-rating" role="group" [attr.aria-label]="ariaLabel">
      @for (star of stars; track star) {
        <button
          type="button"
          class="star-button"
          [class.is-active]="star <= value"
          [disabled]="readonly"
          [attr.aria-pressed]="star <= value"
          (click)="select(star)"
        >
          ★
        </button>
      }
    </div>
  `,
  styles: [
    `
      .star-rating {
        direction: ltr;
        display: inline-flex;
        gap: 2px;
      }

      .star-button {
        align-items: center;
        appearance: none;
        background: transparent;
        border: 0;
        color: var(--app-color-outline);
        display: inline-flex;
        font-size: 1.45rem;
        height: var(--app-touch-target);
        justify-content: center;
        line-height: 1;
        min-width: var(--app-touch-target);
        padding: 0;
      }

      .star-button.is-active {
        color: var(--app-color-accent);
      }

      .star-button:disabled {
        opacity: 1;
      }
    `
  ]
})
export class StarRatingComponent {
  @Input() value = 0;
  @Input() readonly = false;
  @Input() ariaLabel = 'التقييم بالنجوم';
  @Output() valueChange = new EventEmitter<number>();

  protected readonly stars = [1, 2, 3, 4, 5];

  select(value: number): void {
    if (!this.readonly) {
      this.value = value;
      this.valueChange.emit(value);
    }
  }
}
