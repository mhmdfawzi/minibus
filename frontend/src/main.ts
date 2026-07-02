import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { RouteReuseStrategy } from '@angular/router';
import * as Sentry from '@sentry/capacitor';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authRefreshInterceptor } from './app/auth-refresh.interceptor';
import { environment } from './environments/environment';

if (environment.sentryDsn) {
  Sentry.init({
    dsn: environment.sentryDsn,
    environment: environment.production ? 'production' : 'development'
  });
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([authRefreshInterceptor])),
    provideIonicAngular(),
    provideRouter(routes),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ]
}).catch((error: unknown) => console.error(error));
