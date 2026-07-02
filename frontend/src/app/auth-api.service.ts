import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
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

export type DevicePlatform = 'android' | 'ios';

export interface RegisterDevicePayload {
  token: string;
  platform: DevicePlatform;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly accessTokenKey = 'transport_access_token';
  private readonly refreshTokenKey = 'transport_refresh_token';
  private readonly deviceIdKey = 'transport_device_id';
  private readonly sessionStoredSubject = new Subject<void>();
  readonly sessionStored$ = this.sessionStoredSubject.asObservable();

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

  registerDevice(payload: RegisterDevicePayload): Observable<unknown> {
    return this.http.post(`${this.apiBaseUrl}/devices/register`, payload, {
      headers: this.authHeaders()
    });
  }

  deleteDevice(token: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(
      `${this.apiBaseUrl}/devices/${encodeURIComponent(token)}`,
      { headers: this.authHeaders() }
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  clearSession(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  private storeSession(response: AuthResponse): void {
    localStorage.setItem(this.accessTokenKey, response.accessToken);
    localStorage.setItem(this.refreshTokenKey, response.refreshToken);
    this.sessionStoredSubject.next();
  }

  authHeaders(): Record<string, string> {
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
