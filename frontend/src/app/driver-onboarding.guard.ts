import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { DriversService } from './api/drivers.service';

export const approvedDriverGuard: CanActivateFn = () => {
  const driversService = inject(DriversService);
  const router = inject(Router);

  return driversService.getMine().pipe(
    map((driver) => {
      if (driver.status === 'approved') {
        return true;
      }

      return router.parseUrl('/driver/pending-approval');
    }),
    catchError(() => of(router.parseUrl('/driver/register')))
  );
};
