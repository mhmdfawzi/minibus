import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthApiService } from '../auth-api.service';
import { ApiId, ISODate } from './api-types';

export interface TripSearchQuery {
  pickupStopId: ApiId;
  dropoffStopId: ApiId;
  date: ISODate;
}

export interface TripsApi {
  search(query: TripSearchQuery): Observable<DriverTrip[]>;
}

export type DriverTripStatus = 'open' | 'started' | 'completed' | 'cancelled';

export interface DriverTrip {
  id: ApiId;
  routeId: ApiId;
  driverId: ApiId;
  tripDate: ISODate;
  startTime: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: string;
  status: DriverTripStatus;
  createdAt: string;
  updatedAt: string;
  driverCar?: {
    model: string;
    plate: string;
    color: string;
  };
}

export interface TripMutationPayload {
  routeId: ApiId;
  tripDate: ISODate;
  startTime: string;
  totalSeats: number;
  pricePerSeat: number;
}

@Injectable({ providedIn: 'root' })
export class TripsService implements TripsApi {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(
    private readonly authApi: AuthApiService,
    private readonly http: HttpClient
  ) {}

  search(query: TripSearchQuery): Observable<DriverTrip[]> {
    const params = {
      pickupStopId: query.pickupStopId,
      dropoffStopId: query.dropoffStopId,
      date: query.date
    };

    return this.http.get<DriverTrip[]>(`${this.apiBaseUrl}/trips/search`, {
      headers: this.authApi.authHeaders(),
      params
    });
  }

  listMine(): Observable<DriverTrip[]> {
    return this.http.get<DriverTrip[]>(`${this.apiBaseUrl}/trips/my`, {
      headers: this.authApi.authHeaders()
    });
  }

  get(tripId: ApiId): Observable<DriverTrip> {
    return this.http.get<DriverTrip>(`${this.apiBaseUrl}/trips/${tripId}`, {
      headers: this.authApi.authHeaders()
    });
  }

  create(payload: TripMutationPayload): Observable<DriverTrip> {
    return this.http.post<DriverTrip>(`${this.apiBaseUrl}/trips`, payload, {
      headers: this.authApi.authHeaders()
    });
  }

  update(tripId: ApiId, payload: Partial<TripMutationPayload>): Observable<DriverTrip> {
    return this.http.patch<DriverTrip>(`${this.apiBaseUrl}/trips/${tripId}`, payload, {
      headers: this.authApi.authHeaders()
    });
  }

  start(tripId: ApiId): Observable<DriverTrip> {
    return this.http.patch<DriverTrip>(
      `${this.apiBaseUrl}/trips/${tripId}/start`,
      {},
      { headers: this.authApi.authHeaders() }
    );
  }

  complete(tripId: ApiId): Observable<DriverTrip> {
    return this.http.patch<DriverTrip>(
      `${this.apiBaseUrl}/trips/${tripId}/complete`,
      {},
      { headers: this.authApi.authHeaders() }
    );
  }

  cancel(tripId: ApiId): Observable<DriverTrip> {
    return this.http.patch<DriverTrip>(
      `${this.apiBaseUrl}/trips/${tripId}/cancel`,
      {},
      { headers: this.authApi.authHeaders() }
    );
  }
}
