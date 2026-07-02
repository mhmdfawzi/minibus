import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthApiService } from './auth-api.service';

export type RouteDirection = 'outbound' | 'return';
export type TripStatus = 'open' | 'started' | 'completed' | 'cancelled';
export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'completed'
  | 'expired';

export interface RouteSummary {
  id: string;
  name: string;
  direction: RouteDirection;
  isActive: boolean;
  createdAt: string;
}

export interface RouteStop {
  id: string;
  routeId: string;
  name: string;
  orderIndex: number;
  estimatedOffsetMinutes: number;
  isActive: boolean;
}

export interface Trip {
  id: string;
  routeId: string;
  driverId: string;
  tripDate: string;
  startTime: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: string;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  driverCar?: {
    model: string;
    plate: string;
    color: string;
  };
}

export interface Booking {
  id: string;
  tripId: string;
  passengerId: string;
  pickupStopId: string;
  dropoffStopId: string;
  seatsCount: number;
  price: string;
  status: BookingStatus;
  holdExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DriverProfile {
  id: string;
  fullName: string | null;
  phone: string | null;
  carModel: string;
  carPlate: string;
  carColor: string;
  status: string;
  ratingAverage: number | null;
  ratingCount: number;
}

export interface Rating {
  id: string;
  tripId: string;
  passengerId: string;
  driverId: string;
  rate: number;
  comment: string | null;
  createdAt: string;
}

export interface PassengerBookingView {
  booking: Booking;
  trip?: Trip;
  driver?: DriverProfile;
}

export interface RegisterDriverPayload {
  nationalId: string;
  licenseNumber: string;
  carModel: string;
  carPlate: string;
  carColor: string;
}

export interface AdminDriver {
  id: string;
  userId: string;
  nationalId: string;
  licenseNumber: string;
  carModel: string;
  carPlate: string;
  carColor: string;
  docUrls: string[];
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    phone: string | null;
    fullName: string | null;
    role: string;
    isActive: boolean;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminTrip extends Trip {
  route?: {
    id: string;
    name: string;
  };
  driver?: {
    id: string;
    fullName: string | null;
    phone: string | null;
  };
  bookingCount: number;
}

export interface AdminBooking extends Booking {
  passenger?: {
    id: string;
    fullName: string | null;
    phone: string | null;
  };
  trip?: {
    id: string;
    routeId: string;
    routeName: string;
    driverId: string;
    driverName: string | null;
    tripDate: string;
    startTime: string;
  };
}

@Injectable({ providedIn: 'root' })
export class PilotApiService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly authApi: AuthApiService
  ) {}

  listRoutes(): Observable<RouteSummary[]> {
    return this.http.get<RouteSummary[]>(`${this.apiBaseUrl}/routes`, {
      headers: this.authApi.authHeaders()
    });
  }

  listStops(routeId: string): Observable<RouteStop[]> {
    return this.http.get<RouteStop[]>(`${this.apiBaseUrl}/routes/${routeId}/stops`, {
      headers: this.authApi.authHeaders()
    });
  }

  searchTrips(pickupStopId: string, dropoffStopId: string, date: string): Observable<Trip[]> {
    const params = new HttpParams()
      .set('pickupStopId', pickupStopId)
      .set('dropoffStopId', dropoffStopId)
      .set('date', date);

    return this.http.get<Trip[]>(`${this.apiBaseUrl}/trips/search`, {
      headers: this.authApi.authHeaders(),
      params
    });
  }

  createBooking(payload: {
    tripId: string;
    pickupStopId: string;
    dropoffStopId: string;
    seatsCount: number;
  }): Observable<Booking> {
    return this.http.post<Booking>(`${this.apiBaseUrl}/bookings`, payload, {
      headers: this.authApi.authHeaders()
    });
  }

  listMyBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiBaseUrl}/bookings/my`, {
      headers: this.authApi.authHeaders()
    });
  }

  listDriverBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiBaseUrl}/drivers/bookings`, {
      headers: this.authApi.authHeaders()
    });
  }

  acceptBooking(bookingId: string): Observable<Booking> {
    return this.http.patch<Booking>(
      `${this.apiBaseUrl}/bookings/${bookingId}/accept`,
      {},
      { headers: this.authApi.authHeaders() }
    );
  }

  rejectBooking(bookingId: string): Observable<Booking> {
    return this.http.patch<Booking>(
      `${this.apiBaseUrl}/bookings/${bookingId}/reject`,
      {},
      { headers: this.authApi.authHeaders() }
    );
  }

  getTrip(tripId: string): Observable<Trip> {
    return this.http.get<Trip>(`${this.apiBaseUrl}/trips/${tripId}`, {
      headers: this.authApi.authHeaders()
    });
  }

  listMyTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.apiBaseUrl}/trips/my`, {
      headers: this.authApi.authHeaders()
    });
  }

  createTrip(payload: {
    routeId: string;
    tripDate: string;
    startTime: string;
    totalSeats: number;
    pricePerSeat: number;
  }): Observable<Trip> {
    return this.http.post<Trip>(`${this.apiBaseUrl}/trips`, payload, {
      headers: this.authApi.authHeaders()
    });
  }

  startTrip(tripId: string): Observable<Trip> {
    return this.http.patch<Trip>(
      `${this.apiBaseUrl}/trips/${tripId}/start`,
      {},
      { headers: this.authApi.authHeaders() }
    );
  }

  completeTrip(tripId: string): Observable<Trip> {
    return this.http.patch<Trip>(
      `${this.apiBaseUrl}/trips/${tripId}/complete`,
      {},
      { headers: this.authApi.authHeaders() }
    );
  }

  cancelTrip(tripId: string): Observable<Trip> {
    return this.http.patch<Trip>(
      `${this.apiBaseUrl}/trips/${tripId}/cancel`,
      {},
      { headers: this.authApi.authHeaders() }
    );
  }

  getDriverProfile(driverId: string): Observable<DriverProfile> {
    return this.http.get<DriverProfile>(`${this.apiBaseUrl}/drivers/${driverId}`, {
      headers: this.authApi.authHeaders()
    });
  }

  createRating(payload: {
    tripId: string;
    rate: number;
    comment?: string;
  }): Observable<Rating> {
    return this.http.post<Rating>(`${this.apiBaseUrl}/ratings`, payload, {
      headers: this.authApi.authHeaders()
    });
  }

  registerDriver(payload: RegisterDriverPayload): Observable<unknown> {
    return this.http.post(`${this.apiBaseUrl}/drivers/register`, payload, {
      headers: this.authApi.authHeaders()
    });
  }

  uploadDriverDocuments(files: File[]): Observable<unknown> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('documents', file);
    }

    return this.http.post(`${this.apiBaseUrl}/drivers/documents`, formData, {
      headers: this.authApi.authHeaders()
    });
  }

  triggerBackendMonitoringTest(): Observable<unknown> {
    return this.http.get(`${this.apiBaseUrl}/health/sentry-test`, {
      headers: this.authApi.authHeaders()
    });
  }

  createAdminRoute(payload: {
    name: string;
    direction: RouteDirection;
    isActive?: boolean;
  }): Observable<RouteSummary> {
    return this.http.post<RouteSummary>(`${this.apiBaseUrl}/admin/routes`, payload, {
      headers: this.authApi.authHeaders()
    });
  }

  createAdminStop(
    routeId: string,
    payload: {
      name: string;
      orderIndex: number;
      estimatedOffsetMinutes: number;
      isActive?: boolean;
    }
  ): Observable<RouteStop> {
    return this.http.post<RouteStop>(`${this.apiBaseUrl}/admin/routes/${routeId}/stops`, payload, {
      headers: this.authApi.authHeaders()
    });
  }

  listPendingDrivers(): Observable<AdminDriver[]> {
    return this.http.get<AdminDriver[]>(`${this.apiBaseUrl}/admin/drivers/pending`, {
      headers: this.authApi.authHeaders()
    });
  }

  approveDriver(driverId: string): Observable<AdminDriver> {
    return this.http.patch<AdminDriver>(
      `${this.apiBaseUrl}/admin/drivers/${driverId}/approve`,
      {},
      { headers: this.authApi.authHeaders() }
    );
  }

  suspendDriver(driverId: string, rejectionReason?: string): Observable<AdminDriver> {
    return this.http.patch<AdminDriver>(
      `${this.apiBaseUrl}/admin/drivers/${driverId}/suspend`,
      { rejectionReason },
      { headers: this.authApi.authHeaders() }
    );
  }

  rejectDriver(driverId: string, rejectionReason: string): Observable<AdminDriver> {
    return this.http.patch<AdminDriver>(
      `${this.apiBaseUrl}/admin/drivers/${driverId}/reject`,
      { rejectionReason },
      { headers: this.authApi.authHeaders() }
    );
  }

  listAdminTrips(): Observable<PaginatedResponse<AdminTrip>> {
    return this.http.get<PaginatedResponse<AdminTrip>>(`${this.apiBaseUrl}/admin/trips`, {
      headers: this.authApi.authHeaders()
    });
  }

  listAdminBookings(): Observable<PaginatedResponse<AdminBooking>> {
    return this.http.get<PaginatedResponse<AdminBooking>>(`${this.apiBaseUrl}/admin/bookings`, {
      headers: this.authApi.authHeaders()
    });
  }
}
