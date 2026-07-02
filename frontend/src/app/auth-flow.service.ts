import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUser } from './auth-api.service';

@Injectable({ providedIn: 'root' })
export class AuthFlowService {
  constructor(private readonly router: Router) {}

  async goAfterAuth(user: AuthUser): Promise<void> {
    if (!user.isActive) {
      await this.router.navigateByUrl('/profile/setup', { replaceUrl: true });
      return;
    }

    if (user.role === 'driver') {
      await this.router.navigateByUrl('/driver/trips', { replaceUrl: true });
      return;
    }

    if (user.role === 'admin') {
      await this.router.navigateByUrl('/admin', { replaceUrl: true });
      return;
    }

    await this.router.navigateByUrl('/passenger/home', { replaceUrl: true });
  }
}
