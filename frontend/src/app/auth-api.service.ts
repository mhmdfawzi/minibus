import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

export type UserRole = 'passenger' | 'driver' | 'admin';

export interface AuthUser {
  id: string;
  firebaseUid: string;
  phone: string | null;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
  preferredLocale: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface CompleteProfilePayload {
  fullName: string;
  role: 'passenger' | 'driver';
  preferredLocale: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly accessTokenKey = 'transport_access_token';
  private readonly refreshTokenKey = 'transport_refresh_token';
  private readonly deviceIdKey = 'transport_device_id';

  constructor(private readonly http: HttpClient) {}

  firebaseLogin(firebaseIdToken: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/auth/firebase-login`, {
        firebaseIdToken,
        deviceId: this.getDeviceId()
      })
      .pipe(tap((response) => this.storeSession(response)));
  }

  refresh(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/auth/refresh`, {
        refreshToken: localStorage.getItem(this.refreshTokenKey),
        deviceId: this.getDeviceId()
      })
      .pipe(tap((response) => this.storeSession(response)));
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.apiBaseUrl}/auth/me`, {
      headers: this.authHeaders()
    });
  }

  completeProfile(payload: CompleteProfilePayload): Observable<AuthResponse> {
    return this.http.patch<AuthResponse>(
      `${this.apiBaseUrl}/auth/complete-profile`,
      payload,
      { headers: this.authHeaders() }
    ).pipe(tap((response) => this.storeSession(response)));
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  clearSession(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  private storeSession(response: AuthResponse): void {
    localStorage.setItem(this.accessTokenKey, response.accessToken);
    localStorage.setItem(this.refreshTokenKey, response.refreshToken);
  }

  private authHeaders(): Record<string, string> {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private getDeviceId(): string {
    const existingDeviceId = localStorage.getItem(this.deviceIdKey);
    if (existingDeviceId) {
      return existingDeviceId;
    }

    const newDeviceId = crypto.randomUUID();
    localStorage.setItem(this.deviceIdKey, newDeviceId);
    return newDeviceId;
  }
}
