import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [IonContent],
  template: `
    <ion-content class="stitch-welcome" fullscreen>
      <div class="welcome-wave" aria-hidden="true"></div>
      <div class="welcome-glow welcome-glow-top" aria-hidden="true"></div>
      <div class="welcome-glow welcome-glow-bottom" aria-hidden="true"></div>

      <main class="welcome-canvas">
        <div class="welcome-top"></div>

        <section class="welcome-brand">
          <div class="welcome-logo" aria-hidden="true">
            <span class="material-symbols-outlined">sailing</span>
          </div>
          <div>
            <h1>مسار دمياط</h1>
            <p>وسيلتك الموثوقة للتنقل بذكاء في قلب مدينة دمياط. رحلتك تبدأ هنا.</p>
          </div>
        </section>

        <div class="welcome-footer">
          <button class="stitch-primary-action welcome-action" type="button" (click)="continue()">
            <span class="material-symbols-outlined">phone_iphone</span>
            <span>المتابعة برقم الهاتف</span>
          </button>
          <p>
            بالاستمرار، أنت توافق على <a href="#">شروط الخدمة</a> و
            <a href="#">سياسة الخصوصية</a>
          </p>
        </div>
      </main>
    </ion-content>
  `
})
export class WelcomePage {
  constructor(private readonly router: Router) {}

  continue(): void {
    void this.router.navigateByUrl('/auth/phone');
  }
}
