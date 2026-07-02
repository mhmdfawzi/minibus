import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiId, ISODateTime } from './api-types';

export type BookingUiStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed' | 'expired';

export interface BookingView {
  id: ApiId;
  tripId: ApiId;
  seatsCount: number;
  price: number;
  status: BookingUiStatus;
  createdAt: ISODateTime;
}

export interface BookingsApi {
  listMine(): Observable<BookingView[]>;
}

@Injectable({ providedIn: 'root' })
export class BookingsService implements BookingsApi {
  listMine(): Observable<BookingView[]> {
    // TODO: replace mock once Phase 4 UI screens move off PilotApiService.
    return of([]);
  }
}
