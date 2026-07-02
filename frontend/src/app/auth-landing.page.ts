import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthApiService } from './auth-api.service';
import { AuthFlowService } from './auth-flow.service';
import { LoadingSkeletonComponent } from './shared/loading-skeleton.component';

@Component({
  selector: 'app-auth-landing',
  standalone: true,
  imports: [IonContent, LoadingSkeletonComponent],
  template: `
    <ion-content class="auth-screen">
      <app-loading-skeleton [count]="2" />
    </ion-content>
  `
})
export class AuthLandingPage {
  constructor(
    private readonly authApi: AuthApiService,
    private readonly authFlow: AuthFlowService,
    private readonly router: Router
  ) {}

  ionViewWillEnter(): void {
    void this.resolveSession();
  }

  private async resolveSession(): Promise<void> {
    if (!this.authApi.getAccessToken() && !this.authApi.getRefreshToken()) {
      await this.router.navigateByUrl('/welcome', { replaceUrl: true });
      return;
    }

    this.authApi.me().subscribe({
      next: (user) => void this.authFlow.goAfterAuth(user),
      error: () => {
        this.authApi.clearSession();
        void this.router.navigateByUrl('/welcome', { replaceUrl: true });
      }
    });
  }
}
