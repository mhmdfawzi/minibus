import { HttpClient, HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, filter, map } from 'rxjs';
import { getApiBaseUrl } from '../api-base-url';
import { AuthApiService } from '../auth-api.service';

export type DriverReviewStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface DriverRegistrationPayload {
  nationalId: string;
  licenseNumber: string;
  carModel: string;
  carPlate: string;
  carColor: string;
}

export interface DriverOnboardingProfile extends DriverRegistrationPayload {
  id: string;
  userId: string;
  docUrls: string[];
  status: DriverReviewStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicDriverProfile {
  id: string;
  fullName: string | null;
  phone: string | null;
  carModel: string;
  carPlate: string;
  carColor: string;
  status: DriverReviewStatus;
  ratingAverage: number | null;
  ratingCount: number;
}

export interface DriverUploadProgress {
  state: 'progress' | 'done';
  progress: number;
  profile?: DriverOnboardingProfile;
}

@Injectable({ providedIn: 'root' })
export class DriversService {
  private readonly apiBaseUrl = getApiBaseUrl();

  constructor(
    private readonly http: HttpClient,
    private readonly authApi: AuthApiService
  ) {}

  getMine(): Observable<DriverOnboardingProfile> {
    return this.http.get<DriverOnboardingProfile>(`${this.apiBaseUrl}/drivers/me`, {
      headers: this.authApi.authHeaders()
    });
  }

  getPublicProfile(driverId: string): Observable<PublicDriverProfile> {
    return this.http.get<PublicDriverProfile>(`${this.apiBaseUrl}/drivers/${driverId}`, {
      headers: this.authApi.authHeaders()
    });
  }

  register(payload: DriverRegistrationPayload): Observable<DriverOnboardingProfile> {
    return this.http.post<DriverOnboardingProfile>(`${this.apiBaseUrl}/drivers/register`, payload, {
      headers: this.authApi.authHeaders()
    });
  }

  uploadDocuments(files: File[]): Observable<DriverUploadProgress> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('documents', file);
    }

    return this.http
      .post<DriverOnboardingProfile>(`${this.apiBaseUrl}/drivers/documents`, formData, {
        headers: this.authApi.authHeaders(),
        observe: 'events',
        reportProgress: true
      })
      .pipe(
        filter((event: HttpEvent<DriverOnboardingProfile>) => {
          return event.type === HttpEventType.UploadProgress || event.type === HttpEventType.Response;
        }),
        map((event: HttpEvent<DriverOnboardingProfile>): DriverUploadProgress => {
          if (event.type === HttpEventType.UploadProgress) {
            const total = event.total ?? files.reduce((sum, file) => sum + file.size, 0);
            return {
              state: 'progress',
              progress: total > 0 ? Math.round((event.loaded / total) * 100) : 0
            };
          }

          const response = event as HttpResponse<DriverOnboardingProfile>;
          return {
            state: 'done',
            progress: 100,
            profile: response.body ?? undefined
          };
        })
      );
  }
}
