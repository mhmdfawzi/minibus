import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom, lastValueFrom, tap } from 'rxjs';
import { DriversService } from './api/drivers.service';

interface DriverDocumentSlot {
  key: 'id' | 'license';
  label: string;
  icon: string;
  file: File | null;
  previewUrl: string;
}

@Component({
  selector: 'app-driver-registration',
  standalone: true,
  imports: [FormsModule, IonContent, IonSpinner],
  template: `
    <ion-content class="stitch-auth-page" fullscreen>
      <header class="stitch-topbar">
        <div class="stitch-title-with-back">
          <button class="stitch-icon-button" type="button" (click)="goBack()" aria-label="رجوع">
            <span class="material-symbols-outlined rtl-back-icon">arrow_back</span>
          </button>
          <h1 class="stitch-brand-title">مسار دمياط</h1>
        </div>
        <div class="stitch-top-spacer"></div>
      </header>

      <main class="driver-register-layout">
        <section class="driver-register-heading">
          <h2>تسجيل السائق</h2>
          <p>يرجى إكمال البيانات التالية للانضمام إلى فريق مسار دمياط.</p>
        </section>

        <form class="driver-register-form" (ngSubmit)="submit()">
          <section class="driver-form-card">
            <label for="national-id">الرقم القومي (14 رقم)</label>
            <input
              id="national-id"
              name="nationalId"
              inputmode="numeric"
              placeholder="أدخل الرقم القومي الخاص بك"
              [(ngModel)]="form.nationalId"
              required
            />

            <div class="document-block">
              <label>صورة البطاقة الشخصية</label>
              <button
                class="upload-dashed"
                type="button"
                [class.has-file]="documents[0].file"
                (click)="idInput.click()"
              >
                @if (documents[0].previewUrl) {
                  <img [src]="documents[0].previewUrl" alt="" />
                } @else {
                  <span class="material-symbols-outlined">add_a_photo</span>
                  <small>اضغط لرفع صورة البطاقة</small>
                }
              </button>
              <input
                #idInput
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                (change)="selectDocument($event, 0)"
              />
            </div>
          </section>

          <section class="driver-form-card">
            <label for="license-number">رقم الرخصة</label>
            <input
              id="license-number"
              name="licenseNumber"
              placeholder="أدخل رقم رخصة القيادة"
              [(ngModel)]="form.licenseNumber"
              required
            />

            <div class="document-block">
              <label>صورة رخصة القيادة</label>
              <button
                class="upload-dashed"
                type="button"
                [class.has-file]="documents[1].file"
                (click)="licenseInput.click()"
              >
                @if (documents[1].previewUrl) {
                  <img [src]="documents[1].previewUrl" alt="" />
                } @else {
                  <span class="material-symbols-outlined">license</span>
                  <small>اضغط لرفع صورة الرخصة</small>
                }
              </button>
              <input
                #licenseInput
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                (change)="selectDocument($event, 1)"
              />
            </div>
          </section>

          <section class="driver-form-card vehicle-card">
            <h3>بيانات المركبة</h3>
            <div>
              <label for="car-model">نوع وموديل السيارة</label>
              <input
                id="car-model"
                name="carModel"
                placeholder="مثال: ميكروباص تويوتا 2022"
                [(ngModel)]="form.carModel"
                required
              />
            </div>

            <div class="vehicle-grid">
              <div>
                <label for="car-plate">رقم اللوحة</label>
                <input
                  id="car-plate"
                  name="carPlate"
                  class="centered"
                  placeholder="أ ب ج 123"
                  [(ngModel)]="form.carPlate"
                  required
                />
              </div>
              <div>
                <label for="car-color">لون السيارة</label>
                <select id="car-color" name="carColor" [(ngModel)]="form.carColor" required>
                  <option value="">اختر اللون</option>
                  <option value="أبيض">أبيض</option>
                  <option value="فضي">فضي</option>
                  <option value="أسود">أسود</option>
                  <option value="أزرق">أزرق</option>
                  <option value="أحمر">أحمر</option>
                </select>
              </div>
            </div>
          </section>

          <section class="driver-info-note">
            <span class="material-symbols-outlined">info</span>
            <p>بتقديم طلبك، أنت توافق على معالجة بياناتك الشخصية من قبل هيئة النقل بدمياط للتحقق من الأهلية.</p>
          </section>

          @if (uploadProgress > 0 && uploadProgress < 100) {
            <section class="upload-progress" aria-live="polite">
              <div><span [style.width.%]="uploadProgress"></span></div>
              <p>جاري رفع المستندات... {{ uploadProgress }}%</p>
            </section>
          }

          @if (errorMessage) {
            <p class="stitch-error">{{ errorMessage }}</p>
          }

          <div class="driver-register-footer">
            <button class="stitch-primary-action driver-submit-action" type="submit" [disabled]="isLoading">
              @if (isLoading) {
                <ion-spinner name="crescent" />
              } @else {
                <span>إرسال طلب التسجيل</span>
                <span class="material-symbols-outlined">send</span>
              }
            </button>
          </div>
        </form>
      </main>
    </ion-content>
  `
})
export class DriverRegistrationPage {
  form = {
    nationalId: '',
    licenseNumber: '',
    carModel: '',
    carPlate: '',
    carColor: ''
  };
  documents: DriverDocumentSlot[] = [
    { key: 'id', label: 'صورة البطاقة الشخصية', icon: 'add_a_photo', file: null, previewUrl: '' },
    { key: 'license', label: 'صورة رخصة القيادة', icon: 'license', file: null, previewUrl: '' }
  ];
  errorMessage = '';
  isLoading = false;
  uploadProgress = 0;

  constructor(
    private readonly driversService: DriversService,
    private readonly router: Router
  ) {}

  goBack(): void {
    void this.router.navigateByUrl('/driver/pending-approval');
  }

  selectDocument(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;

    const error = this.validateFile(file);
    if (error) {
      this.errorMessage = error;
      input.value = '';
      return;
    }

    if (this.documents[index].previewUrl) {
      URL.revokeObjectURL(this.documents[index].previewUrl);
    }

    this.documents[index] = {
      ...this.documents[index],
      file,
      previewUrl: URL.createObjectURL(file)
    };
    this.errorMessage = '';
  }

  async submit(): Promise<void> {
    this.errorMessage = this.validateForm();
    if (this.errorMessage) return;

    this.isLoading = true;
    this.uploadProgress = 0;
    try {
      await firstValueFrom(
        this.driversService.register({
          nationalId: this.form.nationalId.trim(),
          licenseNumber: this.form.licenseNumber.trim(),
          carModel: this.form.carModel.trim(),
          carPlate: this.form.carPlate.trim(),
          carColor: this.form.carColor.trim()
        })
      );

      await lastValueFrom(
        this.driversService.uploadDocuments(this.documents.map((document) => document.file as File)).pipe(
          tap((event) => {
            this.uploadProgress = event.progress;
          })
        )
      );

      await this.router.navigateByUrl('/driver/pending-approval', { replaceUrl: true });
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'تعذر إرسال طلب التسجيل. حاول مرة أخرى.';
    } finally {
      this.isLoading = false;
    }
  }

  private validateForm(): string {
    if (!/^\d{14}$/.test(this.form.nationalId.trim())) {
      return 'الرقم القومي يجب أن يتكون من 14 رقم';
    }
    if (this.form.licenseNumber.trim().length < 4) {
      return 'اكتب رقم رخصة صحيح';
    }
    if (this.form.carModel.trim().length < 2 || this.form.carPlate.trim().length < 2 || !this.form.carColor) {
      return 'أكمل بيانات المركبة';
    }
    if (this.documents.some((document) => !document.file)) {
      return 'ارفع صورة البطاقة وصورة الرخصة قبل الإرسال';
    }
    return '';
  }

  private validateFile(file: File): string {
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowedTypes.has(file.type)) {
      return 'الصور المسموحة فقط: JPG أو PNG أو WEBP';
    }
    if (file.size > 5 * 1024 * 1024) {
      return 'حجم الصورة يجب ألا يتجاوز 5 ميجابايت';
    }
    return '';
  }
}
