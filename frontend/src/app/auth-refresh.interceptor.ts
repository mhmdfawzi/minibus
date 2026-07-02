import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthApiService } from './auth-api.service';

export const authRefreshInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authApi = inject(AuthApiService);
  const isApiRequest = request.url.startsWith(environment.apiBaseUrl);
  const isAuthSessionRequest = request.url.includes('/auth/firebase-login') || request.url.includes('/auth/refresh');
  const accessToken = authApi.getAccessToken();
  const authRequest =
    isApiRequest && accessToken && !request.headers.has('Authorization')
      ? request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
      : request;

  return next(authRequest).pipe(
    catchError((error: unknown) => {
      if (
        !isApiRequest ||
        isAuthSessionRequest ||
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        !authApi.getRefreshToken()
      ) {
        return throwError(() => error);
      }

      return authApi.refresh().pipe(
        switchMap(() => {
          const refreshedToken = authApi.getAccessToken();
          if (!refreshedToken) {
            return throwError(() => error);
          }

          return next(request.clone({ setHeaders: { Authorization: `Bearer ${refreshedToken}` } }));
        }),
        catchError((refreshError: unknown) => {
          authApi.clearSession();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
