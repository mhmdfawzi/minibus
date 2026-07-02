import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import { AppStatus, StatusBadgeComponent } from './status-badge.component';

export interface TripCardViewModel {
  id: string;
  routeName: string;
  pickupName?: string;
  dropoffName?: string;
  date: string;
  startTime: string;
  availableSeats: number;
  totalSeats: number;
  pricePerSeat: string | number;
  driverLabel?: string;
  status?: AppStatus;
}

@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [IonButton, StatusBadgeComponent],
  template: `
    <article class="trip-card">
      <div class="trip-main">
        <div>
          <p class="trip-label">{{ trip.date }}</p>
          <h2>{{ trip.routeName }}</h2>
          @if (trip.pickupName || trip.dropoffName) {
            <p class="trip-route">{{ trip.pickupName || 'نقطة الصعود' }} ← {{ trip.dropoffName || 'نقطة النزول' }}</p>
          }
        </div>
        <div class="trip-meta">
          <strong>{{ trip.startTime }}</strong>
          <span>{{ trip.pricePerSeat }} جنيه</span>
        </div>
      </div>

      <div class="trip-footer">
        <span>{{ trip.availableSeats }} من {{ trip.totalSeats }} مقاعد</span>
        @if (trip.driverLabel) {
          <span>{{ trip.driverLabel }}</span>
        }
        @if (trip.status) {
          <app-status-badge [status]="trip.status" />
        }
      </div>

      @if (actionLabel) {
        <ion-button expand="block" type="button" (click)="action.emit(trip.id)">{{ actionLabel }}</ion-button>
      }
    </article>
  `,
  styles: [
    `
      .trip-card {
        background: var(--app-color-surface);
        border-radius: var(--app-radius-card);
        box-shadow: var(--app-shadow-card);
        color: var(--app-color-text);
        display: grid;
        gap: var(--app-space-sm);
        padding: var(--app-space-sm);
      }

      .trip-main,
      .trip-footer {
        align-items: start;
        display: flex;
        gap: var(--app-space-sm);
        justify-content: space-between;
      }

      .trip-meta {
        display: grid;
        gap: 4px;
        justify-items: end;
        min-width: 84px;
      }

      .trip-label,
      .trip-route,
      .trip-footer,
      .trip-meta span {
        color: var(--app-color-text-muted);
        font-size: 0.875rem;
      }

      h2,
      p {
        margin: 0;
      }

      h2 {
        font-size: 1.125rem;
        font-weight: 800;
        line-height: 1.35;
      }

      .trip-footer {
        flex-wrap: wrap;
      }
    `
  ]
})
export class TripCardComponent {
  @Input({ required: true }) trip!: TripCardViewModel;
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<string>();
}
