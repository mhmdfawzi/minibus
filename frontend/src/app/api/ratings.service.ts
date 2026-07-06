import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { getApiBaseUrl } from '../api-base-url';
import { AuthApiService } from '../auth-api.service';
import { ApiId, ISODateTime } from './api-types';

export interface RatingView {
  id: ApiId;
  tripId: ApiId;
  passengerId: ApiId;
  driverId: ApiId;
  rate: number;
  comment: string | null;
  createdAt: ISODateTime;
  passenger?: {
    fullName: string | null;
  };
}

export interface CreateRatingPayload {
  tripId: ApiId;
  rate: number;
  comment?: string;
}

@Injectable({ providedIn: 'root' })
export class RatingsService {
  private readonly apiBaseUrl = getApiBaseUrl();

  constructor(
    private readonly authApi: AuthApiService,
    private readonly http: HttpClient
  ) {}

  create(payload: CreateRatingPayload): Observable<RatingView> {
    return this.http.post<RatingView>(`${this.apiBaseUrl}/ratings`, payload, {
      headers: this.authApi.authHeaders()
    });
  }

  listDriverRatings(driverId: ApiId): Observable<RatingView[]> {
    return this.http.get<RatingView[]>(`${this.apiBaseUrl}/drivers/${driverId}/ratings`, {
      headers: this.authApi.authHeaders()
    });
  }
}
