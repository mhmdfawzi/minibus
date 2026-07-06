import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiBaseUrl } from '../api-base-url';
import { AuthApiService } from '../auth-api.service';
import { ApiId, ISODateTime } from './api-types';

export type BookingUiStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed' | 'expired';

export interface BookingView {
  id: ApiId;
  tripId: ApiId;
  passengerId: ApiId;
  pickupStopId: ApiId;
  dropoffStopId: ApiId;
  seatsCount: number;
  price: string;
  status: BookingUiStatus;
  holdExpiresAt: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  passenger?: {
    fullName: string | null;
    phone: string | null;
  };
}

export interface BookingsApi {
  listMine(): Observable<BookingView[]>;
  listDriverBookings(): Observable<BookingView[]>;
  create(payload: CreateBookingPayload): Observable<BookingView>;
  accept(bookingId: ApiId): Observable<BookingView>;
  reject(bookingId: ApiId): Observable<BookingView>;
  cancel(bookingId: ApiId): Observable<BookingView>;
}

export interface CreateBookingPayload {
  tripId: ApiId;
  pickupStopId: ApiId;
  dropoffStopId: ApiId;
  seatsCount: number;
}

@Injectable({ providedIn: 'root' })
export class BookingsService implements BookingsApi {
  private readonly apiBaseUrl = getApiBaseUrl();

  constructor(
    private readonly authApi: AuthApiService,
    private readonly http: HttpClient
  ) {}

  listMine(): Observable<BookingView[]> {
    return this.http.get<BookingView[]>(`${this.apiBaseUrl}/bookings/my`, {
      headers: this.authApi.authHeaders()
    });
  }

  listDriverBookings(): Observable<BookingView[]> {
    return this.http.get<BookingView[]>(`${this.apiBaseUrl}/drivers/bookings`, {
      headers: this.authApi.authHeaders()
    });
  }

  create(payload: CreateBookingPayload): Observable<BookingView> {
    return this.http.post<BookingView>(`${this.apiBaseUrl}/bookings`, payload, {
      headers: this.authApi.authHeaders()
    });
  }

  accept(bookingId: ApiId): Observable<BookingView> {
    return this.http.patch<BookingView>(
      `${this.apiBaseUrl}/bookings/${bookingId}/accept`,
      {},
      { headers: this.authApi.authHeaders() }
    );
  }

  reject(bookingId: ApiId): Observable<BookingView> {
    return this.http.patch<BookingView>(
      `${this.apiBaseUrl}/bookings/${bookingId}/reject`,
      {},
      { headers: this.authApi.authHeaders() }
    );
  }

  cancel(bookingId: ApiId): Observable<BookingView> {
    return this.http.patch<BookingView>(
      `${this.apiBaseUrl}/bookings/${bookingId}/cancel`,
      {},
      { headers: this.authApi.authHeaders() }
    );
  }
}
