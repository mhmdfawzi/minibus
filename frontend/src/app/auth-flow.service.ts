import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DriversService } from './api/drivers.service';
import { AuthUser } from './auth-api.service';

@Injectable({ providedIn: 'root' })
export class AuthFlowService {
  constructor(
    private readonly driversService: DriversService,
    private readonly router: Router
  ) {}

  async goAfterAuth(user: AuthUser): Promise<void> {
    if (!user.isActive) {
      await this.router.navigateByUrl('/profile/setup', { replaceUrl: true });
      return;
    }

    if (user.role === 'driver') {
      await this.goAfterDriverAuth();
      return;
    }

    if (user.role === 'admin') {
      await this.router.navigateByUrl('/admin', { replaceUrl: true });
      return;
    }

    await this.router.navigateByUrl('/passenger/home', { replaceUrl: true });
  }

  private async goAfterDriverAuth(): Promise<void> {
    try {
      const driver = await firstValueFrom(this.driversService.getMine());
      if (driver.status === 'approved') {
        await this.router.navigateByUrl('/driver/trips', { replaceUrl: true });
        return;
      }

      await this.router.navigateByUrl('/driver/pending-approval', { replaceUrl: true });
    } catch {
      await this.router.navigateByUrl('/driver/register', { replaceUrl: true });
    }
  }
}
