import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TripCardViewModel } from '../shared/trip-card.component';
import { ApiId, ISODate } from './api-types';

export interface TripSearchQuery {
  pickupStopId: ApiId;
  dropoffStopId: ApiId;
  date: ISODate;
}

export interface TripsApi {
  search(query: TripSearchQuery): Observable<TripCardViewModel[]>;
}

@Injectable({ providedIn: 'root' })
export class TripsService implements TripsApi {
  search(query: TripSearchQuery): Observable<TripCardViewModel[]> {
    // TODO: replace mock once Phase 3/4 UI screens move off PilotApiService.
    return of([
      {
        id: `${query.pickupStopId}-${query.dropoffStopId}`,
        routeName: 'الخلفية إلى دمياط الجديدة',
        pickupName: 'الخلفية',
        dropoffName: 'دمياط الجديدة',
        date: query.date,
        startTime: '08:30',
        availableSeats: 3,
        totalSeats: 7,
        pricePerSeat: 25,
        driverLabel: 'سائق معتمد',
        status: 'open'
      }
    ]);
  }
}
