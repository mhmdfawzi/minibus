import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { getApiBaseUrl } from '../api-base-url';
import { AuthApiService } from '../auth-api.service';
import { ApiId, ISODateTime } from './api-types';

export type NotificationType =
  | 'booking_created'
  | 'booking_accepted'
  | 'booking_rejected'
  | 'booking_cancelled'
  | 'trip_cancelled'
  | 'trip_started';

export interface NotificationData {
  bookingId?: ApiId;
  tripId?: ApiId;
  targetRole?: 'driver' | 'passenger';
}

export interface NotificationView {
  id: ApiId;
  userId: ApiId;
  title: string;
  body: string;
  type: NotificationType;
  data: NotificationData;
  isRead: boolean;
  createdAt: ISODateTime;
}

export interface NotificationsApi {
  list(): Observable<NotificationView[]>;
  markRead(notificationId: ApiId): Observable<NotificationView>;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService implements NotificationsApi {
  private readonly apiBaseUrl = getApiBaseUrl();
  private readonly unreadCountSubject = new BehaviorSubject<number>(0);
  readonly unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private readonly authApi: AuthApiService,
    private readonly http: HttpClient
  ) {}

  list(): Observable<NotificationView[]> {
    return this.http
      .get<NotificationView[]>(`${this.apiBaseUrl}/notifications`, {
        headers: this.authApi.authHeaders()
      })
      .pipe(tap((notifications) => this.setUnreadCount(notifications)));
  }

  markRead(notificationId: ApiId): Observable<NotificationView> {
    return this.http
      .patch<NotificationView>(
        `${this.apiBaseUrl}/notifications/${notificationId}/read`,
        {},
        { headers: this.authApi.authHeaders() }
      )
      .pipe(tap(() => this.refreshUnreadCount()));
  }

  refreshUnreadCount(): void {
    if (!this.authApi.getAccessToken()) return;
    this.list().subscribe({ error: () => undefined });
  }

  incrementUnreadCount(): void {
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
  }

  private setUnreadCount(notifications: NotificationView[]): void {
    this.unreadCountSubject.next(notifications.filter((notification) => !notification.isRead).length);
  }
}
