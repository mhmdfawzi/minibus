import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiId, ISODateTime } from './api-types';

export interface NotificationView {
  id: ApiId;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: ISODateTime;
}

export interface NotificationsApi {
  list(): Observable<NotificationView[]>;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService implements NotificationsApi {
  list(): Observable<NotificationView[]> {
    // TODO: replace mock once Phase 5 UI screens are implemented.
    return of([]);
  }
}
