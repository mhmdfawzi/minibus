import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as Sentry from '@sentry/capacitor';
import { firstValueFrom } from 'rxjs';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { AuthApiService, AuthUser } from './auth-api.service';
import { FirebasePhoneAuthService } from './firebase-phone-auth.service';
import {
  AdminBooking,
  AdminDriver,
  AdminTrip,
  Booking,
  DriverProfile,
  PassengerBookingView,
  PilotApiService,
  RouteStop,
  RouteSummary,
  Trip
} from './pilot-api.service';
import { PushNotificationsService } from './push-notifications.service';

type PilotTab = 'passenger' | 'driver';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FormsModule,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTextarea,
    IonTitle,
    IonToolbar
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>نظام النقل</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (!user) {
        @if (step === 'phone') {
          <form class="auth-form" (ngSubmit)="sendOtp()">
            <ion-item>
              <ion-label position="stacked">رقم الهاتف</ion-label>
              <ion-input
                name="phoneNumber"
                type="tel"
                inputmode="tel"
                dir="ltr"
                placeholder="+201001234567"
                [(ngModel)]="phoneNumber"
                required
              />
            </ion-item>
            <div id="recaptcha-container" class="recaptcha-container"></div>
            <ion-button type="submit" expand="block" [disabled]="isLoading">
              @if (isLoading) {
                <ion-spinner name="crescent" />
              } @else {
                إرسال الرمز
              }
            </ion-button>
          </form>
        } @else {
          <form class="auth-form" (ngSubmit)="verifyOtp()">
            <ion-item>
              <ion-label position="stacked">رمز التحقق</ion-label>
              <ion-input
                name="otpCode"
                type="text"
                inputmode="numeric"
                dir="ltr"
                [(ngModel)]="otpCode"
                required
              />
            </ion-item>
            <ion-button type="submit" expand="block" [disabled]="isLoading">
              @if (isLoading) {
                <ion-spinner name="crescent" />
              } @else {
                تسجيل الدخول
              }
            </ion-button>
            <ion-button fill="clear" expand="block" type="button" (click)="step = 'phone'">
              تغيير رقم الهاتف
            </ion-button>
          </form>
        }
      } @else if (!user.isActive) {
        <form class="auth-form" (ngSubmit)="completeProfile()">
          <ion-item>
            <ion-label position="stacked">الاسم الكامل</ion-label>
            <ion-input name="fullName" [(ngModel)]="fullName" required />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">نوع الحساب</ion-label>
            <ion-select name="role" interface="popover" [(ngModel)]="role">
              <ion-select-option value="passenger">راكب</ion-select-option>
              <ion-select-option value="driver">سائق</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-button type="submit" expand="block" [disabled]="isLoading">حفظ الملف</ion-button>
        </form>
      } @else {
        <section class="pilot-shell">
          <div class="topline">
            <div>
              <h1>أهلاً {{ user.fullName || user.phone }}</h1>
              <p>{{ roleLabel(user.role) }}</p>
            </div>
            <ion-button fill="outline" size="small" (click)="logout()">خروج</ion-button>
          </div>

          @if (user.role !== 'admin') {
            <ion-segment [(ngModel)]="activeTab" (ionChange)="onTabChanged()">
              @if (user.role === 'passenger') {
                <ion-segment-button value="passenger">راكب</ion-segment-button>
              }
              @if (user.role === 'driver') {
                <ion-segment-button value="driver">سائق</ion-segment-button>
              }
            </ion-segment>
          }

          @if (user.role === 'admin') {
            <section class="workspace">
              <ion-card>
                <ion-card-header>
                  <ion-card-title>إدارة المسارات</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <form class="dense-form" (ngSubmit)="createAdminRoute()">
                    <ion-item>
                      <ion-label position="stacked">اسم المسار</ion-label>
                      <ion-input name="adminRouteName" [(ngModel)]="adminRoute.name" required />
                    </ion-item>
                    <ion-item>
                      <ion-label position="stacked">الاتجاه</ion-label>
                      <ion-select name="adminRouteDirection" interface="popover" [(ngModel)]="adminRoute.direction">
                        <ion-select-option value="outbound">ذهاب</ion-select-option>
                        <ion-select-option value="return">عودة</ion-select-option>
                      </ion-select>
                    </ion-item>
                    <ion-button type="submit" expand="block" [disabled]="isLoading">إضافة مسار</ion-button>
                  </form>

                  <form class="dense-form admin-subform" (ngSubmit)="createAdminStop()">
                    <ion-item>
                      <ion-label position="stacked">المسار</ion-label>
                      <ion-select name="adminStopRoute" interface="popover" [(ngModel)]="adminStop.routeId">
                        @for (route of routes; track route.id) {
                          <ion-select-option [value]="route.id">{{ route.name }}</ion-select-option>
                        }
                      </ion-select>
                    </ion-item>
                    <ion-item>
                      <ion-label position="stacked">اسم المحطة</ion-label>
                      <ion-input name="adminStopName" [(ngModel)]="adminStop.name" required />
                    </ion-item>
                    <ion-item>
                      <ion-label position="stacked">الترتيب</ion-label>
                      <ion-input name="adminStopOrder" type="number" min="0" [(ngModel)]="adminStop.orderIndex" required />
                    </ion-item>
                    <ion-item>
                      <ion-label position="stacked">زمن الوصول التقريبي بالدقائق</ion-label>
                      <ion-input
                        name="adminStopOffset"
                        type="number"
                        min="0"
                        [(ngModel)]="adminStop.estimatedOffsetMinutes"
                        required
                      />
                    </ion-item>
                    <ion-button type="submit" expand="block" fill="outline" [disabled]="isLoading">
                      إضافة محطة
                    </ion-button>
                  </form>
                </ion-card-content>
              </ion-card>

              <ion-card>
                <ion-card-header>
                  <ion-card-title>السائقون بانتظار الموافقة</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-button fill="outline" expand="block" (click)="loadAdminData()">تحديث</ion-button>
                  @for (driver of pendingDrivers; track driver.id) {
                    <div class="booking-row">
                      <div>
                        <strong>{{ driver.user?.fullName || driver.user?.phone || 'سائق جديد' }}</strong>
                        <p>{{ driver.carModel }} - {{ driver.carColor }} - {{ driver.carPlate }}</p>
                        <p>رخصة: {{ driver.licenseNumber }} | هوية: {{ driver.nationalId }}</p>
                      </div>
                      <div class="actions">
                        <ion-button size="small" (click)="approveDriver(driver.id)">اعتماد</ion-button>
                        <ion-button size="small" color="danger" fill="outline" (click)="rejectDriver(driver.id)">
                          رفض
                        </ion-button>
                      </div>
                    </div>
                  } @empty {
                    <ion-note>لا يوجد سائقون بانتظار الموافقة.</ion-note>
                  }
                </ion-card-content>
              </ion-card>

              <ion-card>
                <ion-card-header>
                  <ion-card-title>مراقبة الرحلات</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  @for (trip of adminTrips; track trip.id) {
                    <div class="trip-row">
                      <div>
                        <strong>{{ trip.route?.name || routeName(trip.routeId) }}</strong>
                        <p>{{ trip.tripDate }} - {{ trip.startTime }} - {{ tripStatusLabel(trip.status) }}</p>
                        <p>السائق: {{ trip.driver?.fullName || trip.driver?.phone || trip.driverId }}</p>
                        <p>الحجوزات: {{ trip.bookingCount }} | المقاعد: {{ trip.availableSeats }}/{{ trip.totalSeats }}</p>
                      </div>
                      <ion-badge [color]="trip.status === 'cancelled' ? 'medium' : 'success'">
                        {{ tripStatusLabel(trip.status) }}
                      </ion-badge>
                    </div>
                  } @empty {
                    <ion-note>لا توجد رحلات للعرض.</ion-note>
                  }
                </ion-card-content>
              </ion-card>

              <ion-card>
                <ion-card-header>
                  <ion-card-title>مراقبة الحجوزات</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  @for (booking of adminBookings; track booking.id) {
                    <div class="booking-row">
                      <div>
                        <strong>{{ booking.trip?.routeName || booking.tripId }}</strong>
                        <p>{{ statusLabel(booking.status) }} - {{ booking.seatsCount }} مقعد - {{ booking.price }} جنيه</p>
                        <p>الراكب: {{ booking.passenger?.fullName || booking.passenger?.phone || booking.passengerId }}</p>
                      </div>
                      <ion-badge [color]="badgeColor(booking.status)">{{ statusLabel(booking.status) }}</ion-badge>
                    </div>
                  } @empty {
                    <ion-note>لا توجد حجوزات للعرض.</ion-note>
                  }
                </ion-card-content>
              </ion-card>

              <ion-card>
                <ion-card-header>
                  <ion-card-title>اختبار المراقبة</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-button expand="block" fill="outline" (click)="sendMonitoringTest()">
                    إرسال اختبار مراقبة
                  </ion-button>
                </ion-card-content>
              </ion-card>
            </section>
          } @else if (activeTab === 'passenger') {
            <section class="workspace">
              <ion-card>
                <ion-card-header>
                  <ion-card-title>البحث عن رحلة</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <form class="dense-form" (ngSubmit)="searchTrips()">
                    <ion-item>
                      <ion-label position="stacked">المسار</ion-label>
                      <ion-select
                        name="passengerRoute"
                        interface="popover"
                        [(ngModel)]="selectedRouteId"
                        (ionChange)="loadStopsForSelectedRoute()"
                      >
                        @for (route of routes; track route.id) {
                          <ion-select-option [value]="route.id">{{ route.name }}</ion-select-option>
                        }
                      </ion-select>
                    </ion-item>
                    <ion-item>
                      <ion-label position="stacked">نقطة الصعود</ion-label>
                      <ion-select name="pickupStop" interface="popover" [(ngModel)]="pickupStopId">
                        @for (stop of stops; track stop.id) {
                          <ion-select-option [value]="stop.id">{{ stop.name }}</ion-select-option>
                        }
                      </ion-select>
                    </ion-item>
                    <ion-item>
                      <ion-label position="stacked">نقطة النزول</ion-label>
                      <ion-select name="dropoffStop" interface="popover" [(ngModel)]="dropoffStopId">
                        @for (stop of stops; track stop.id) {
                          <ion-select-option [value]="stop.id">{{ stop.name }}</ion-select-option>
                        }
                      </ion-select>
                    </ion-item>
                    <ion-item>
                      <ion-label position="stacked">التاريخ</ion-label>
                      <ion-input name="searchDate" type="date" [(ngModel)]="searchDate" required />
                    </ion-item>
                    <ion-item>
                      <ion-label position="stacked">عدد المقاعد</ion-label>
                      <ion-input
                        name="seatsCount"
                        type="number"
                        inputmode="numeric"
                        min="1"
                        [(ngModel)]="seatsCount"
                        required
                      />
                    </ion-item>
                    <ion-button type="submit" expand="block" [disabled]="isLoading">بحث</ion-button>
                  </form>
                </ion-card-content>
              </ion-card>

              <ion-list class="result-list">
                @for (trip of searchResults; track trip.id) {
                  <ion-card>
                    <ion-card-header>
                      <ion-card-title>{{ routeName(trip.routeId) }} - {{ trip.startTime }}</ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                      <p>المقاعد المتاحة: {{ trip.availableSeats }} من {{ trip.totalSeats }}</p>
                      <p>السعر للمقعد: {{ trip.pricePerSeat }} جنيه</p>
                      @if (trip.driverCar) {
                        <p>{{ trip.driverCar.model }} - {{ trip.driverCar.color }} - {{ trip.driverCar.plate }}</p>
                      }
                      <ion-button expand="block" (click)="bookTrip(trip)" [disabled]="isLoading">
                        طلب الحجز
                      </ion-button>
                    </ion-card-content>
                  </ion-card>
                } @empty {
                  <ion-note>لا توجد نتائج بحث بعد.</ion-note>
                }
              </ion-list>

              <ion-card>
                <ion-card-header>
                  <ion-card-title>حجوزاتي</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-button fill="outline" expand="block" (click)="loadPassengerData()">تحديث</ion-button>
                  @for (item of passengerBookings; track item.booking.id) {
                    <div class="booking-row">
                      <div>
                        <strong>{{ routeName(item.trip?.routeId) }}</strong>
                        <p>{{ statusLabel(item.booking.status) }} - {{ item.booking.price }} جنيه</p>
                        @if (acceptedDriverPhone(item)) {
                          <p dir="ltr">{{ acceptedDriverPhone(item) }}</p>
                        }
                      </div>
                      <ion-badge [color]="badgeColor(item.booking.status)">
                        {{ statusLabel(item.booking.status) }}
                      </ion-badge>
                    </div>
                    @if (item.booking.status === 'completed') {
                      <div class="rating-box">
                        <ion-item>
                          <ion-label position="stacked">التقييم</ion-label>
                          <ion-select
                            interface="popover"
                            [(ngModel)]="ratingForms[item.booking.tripId].rate"
                            [name]="'rate-' + item.booking.id"
                          >
                            <ion-select-option [value]="5">5</ion-select-option>
                            <ion-select-option [value]="4">4</ion-select-option>
                            <ion-select-option [value]="3">3</ion-select-option>
                            <ion-select-option [value]="2">2</ion-select-option>
                            <ion-select-option [value]="1">1</ion-select-option>
                          </ion-select>
                        </ion-item>
                        <ion-item>
                          <ion-label position="stacked">تعليق اختياري</ion-label>
                          <ion-textarea
                            [name]="'comment-' + item.booking.id"
                            [(ngModel)]="ratingForms[item.booking.tripId].comment"
                          />
                        </ion-item>
                        <ion-button fill="outline" expand="block" (click)="rateTrip(item.booking)">
                          إرسال التقييم
                        </ion-button>
                      </div>
                    }
                  } @empty {
                    <ion-note>لا توجد حجوزات حتى الآن.</ion-note>
                  }
                </ion-card-content>
              </ion-card>
            </section>
          } @else {
            <section class="workspace">
              @if (driverProfileRequired) {
                <ion-card>
                  <ion-card-header>
                    <ion-card-title>تسجيل بيانات السائق</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    <form class="dense-form" (ngSubmit)="registerDriverProfile()">
                      <ion-item>
                        <ion-label position="stacked">الرقم القومي</ion-label>
                        <ion-input name="driverNationalId" [(ngModel)]="driverProfile.nationalId" required />
                      </ion-item>
                      <ion-item>
                        <ion-label position="stacked">رقم الرخصة</ion-label>
                        <ion-input name="driverLicenseNumber" [(ngModel)]="driverProfile.licenseNumber" required />
                      </ion-item>
                      <ion-item>
                        <ion-label position="stacked">موديل السيارة</ion-label>
                        <ion-input name="driverCarModel" [(ngModel)]="driverProfile.carModel" required />
                      </ion-item>
                      <ion-item>
                        <ion-label position="stacked">رقم اللوحة</ion-label>
                        <ion-input name="driverCarPlate" [(ngModel)]="driverProfile.carPlate" required />
                      </ion-item>
                      <ion-item>
                        <ion-label position="stacked">لون السيارة</ion-label>
                        <ion-input name="driverCarColor" [(ngModel)]="driverProfile.carColor" required />
                      </ion-item>
                      <ion-button type="submit" expand="block" [disabled]="isLoading">
                        إرسال بيانات السائق
                      </ion-button>
                    </form>
                    <div class="admin-subform">
                      <ion-item>
                        <ion-label position="stacked">صور الهوية والرخصة</ion-label>
                        <input
                          class="file-input"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          (change)="selectDriverDocuments($event)"
                        />
                      </ion-item>
                      <ion-button
                        expand="block"
                        fill="outline"
                        type="button"
                        [disabled]="isLoading || driverDocuments.length < 2"
                        (click)="uploadDriverDocuments()"
                      >
                        رفع المستندات
                      </ion-button>
                      <ion-note>ارفع صورتين على الأقل: الهوية والرخصة.</ion-note>
                    </div>
                    <ion-note>
                      بعد التسجيل، افتح حساب الإدارة واعتمد السائق قبل إنشاء الرحلات.
                    </ion-note>
                  </ion-card-content>
                </ion-card>
              }

              @if (driverApprovalRequired) {
                <ion-card>
                  <ion-card-header>
                    <ion-card-title>بانتظار اعتماد الإدارة</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    <p>
                      تم تسجيل بيانات السائق، لكن الحساب لم يعتمد بعد. افتح لوحة الإدارة واعتمد السائق حتى يستطيع إنشاء الرحلات وإدارة الحجوزات.
                    </p>
                    <ion-button fill="outline" expand="block" (click)="loadDriverData()">تحديث الحالة</ion-button>
                  </ion-card-content>
                </ion-card>
              }

              <ion-card>
                <ion-card-header>
                  <ion-card-title>إنشاء رحلة</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <form class="dense-form" (ngSubmit)="createTrip()">
                    <ion-item>
                      <ion-label position="stacked">المسار</ion-label>
                      <ion-select name="driverRoute" interface="popover" [(ngModel)]="driverTrip.routeId">
                        @for (route of routes; track route.id) {
                          <ion-select-option [value]="route.id">{{ route.name }}</ion-select-option>
                        }
                      </ion-select>
                    </ion-item>
                    <ion-item>
                      <ion-label position="stacked">التاريخ</ion-label>
                      <ion-input name="tripDate" type="date" [(ngModel)]="driverTrip.tripDate" required />
                    </ion-item>
                    <ion-item>
                      <ion-label position="stacked">وقت البداية</ion-label>
                      <ion-input name="startTime" type="time" [(ngModel)]="driverTrip.startTime" required />
                    </ion-item>
                    <ion-item>
                      <ion-label position="stacked">عدد المقاعد</ion-label>
                      <ion-input
                        name="totalSeats"
                        type="number"
                        inputmode="numeric"
                        min="1"
                        [(ngModel)]="driverTrip.totalSeats"
                        required
                      />
                    </ion-item>
                    <ion-item>
                      <ion-label position="stacked">سعر المقعد</ion-label>
                      <ion-input
                        name="pricePerSeat"
                        type="number"
                        inputmode="decimal"
                        min="0"
                        [(ngModel)]="driverTrip.pricePerSeat"
                        required
                      />
                    </ion-item>
                    <ion-button
                      type="submit"
                      expand="block"
                      [disabled]="isLoading || driverProfileRequired || driverApprovalRequired"
                    >
                      نشر الرحلة
                    </ion-button>
                  </form>
                </ion-card-content>
              </ion-card>

              <ion-card>
                <ion-card-header>
                  <ion-card-title>طلباتي ورحلاتي</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-button fill="outline" expand="block" (click)="loadDriverData()">تحديث</ion-button>
                  @for (booking of driverBookings; track booking.id) {
                    <div class="booking-row">
                      <div>
                        <strong>{{ routeName(driverTripRoute(booking.tripId)) }}</strong>
                        <p>{{ statusLabel(booking.status) }} - {{ booking.seatsCount }} مقعد</p>
                      </div>
                      @if (booking.status === 'pending') {
                        <div class="actions">
                          <ion-button size="small" (click)="acceptBooking(booking.id)">قبول</ion-button>
                          <ion-button size="small" color="danger" fill="outline" (click)="rejectBooking(booking.id)">
                            رفض
                          </ion-button>
                        </div>
                      }
                    </div>
                  } @empty {
                    <ion-note>لا توجد طلبات حجز.</ion-note>
                  }

                  @for (trip of myTrips; track trip.id) {
                    <div class="trip-row">
                      <div>
                        <strong>{{ routeName(trip.routeId) }}</strong>
                        <p>{{ trip.tripDate }} - {{ trip.startTime }} - {{ tripStatusLabel(trip.status) }}</p>
                      </div>
                      <div class="actions">
                        @if (trip.status === 'open') {
                          <ion-button size="small" (click)="startTrip(trip.id)">بدء</ion-button>
                        }
                        @if (trip.status === 'started') {
                          <ion-button size="small" (click)="completeTrip(trip.id)">إكمال</ion-button>
                        }
                        @if (trip.status === 'open' || trip.status === 'started') {
                          <ion-button size="small" color="danger" fill="outline" (click)="cancelTrip(trip.id)">
                            إلغاء
                          </ion-button>
                        }
                      </div>
                    </div>
                  } @empty {
                    <ion-note>لم تنشر رحلات بعد.</ion-note>
                  }
                </ion-card-content>
              </ion-card>
            </section>
          }
        </section>
      }

      @if (errorMessage) {
        <ion-note class="screen-note" color="danger">{{ errorMessage }}</ion-note>
      }
      @if (successMessage) {
        <ion-note class="screen-note" color="success">{{ successMessage }}</ion-note>
      }
    </ion-content>
  `
})
export class HomePage {
  step: 'phone' | 'otp' = 'phone';
  activeTab: PilotTab = 'passenger';
  phoneNumber = '';
  otpCode = '';
  fullName = '';
  role: 'passenger' | 'driver' = 'passenger';
  user: AuthUser | null = null;
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  routes: RouteSummary[] = [];
  stops: RouteStop[] = [];
  selectedRouteId = '';
  pickupStopId = '';
  dropoffStopId = '';
  searchDate = this.today();
  seatsCount = 1;
  searchResults: Trip[] = [];
  passengerBookings: PassengerBookingView[] = [];
  ratingForms: Record<string, { rate: number; comment: string }> = {};

  driverTrip = {
    routeId: '',
    tripDate: this.today(),
    startTime: '08:00',
    totalSeats: 4,
    pricePerSeat: 30
  };
  myTrips: Trip[] = [];
  driverBookings: Booking[] = [];
  driverProfileRequired = false;
  driverApprovalRequired = false;
  driverProfile = {
    nationalId: '',
    licenseNumber: '',
    carModel: '',
    carPlate: '',
    carColor: ''
  };
  driverDocuments: File[] = [];
  pendingDrivers: AdminDriver[] = [];
  adminTrips: AdminTrip[] = [];
  adminBookings: AdminBooking[] = [];
  adminRoute = {
    name: '',
    direction: 'outbound' as RouteSummary['direction']
  };
  adminStop = {
    routeId: '',
    name: '',
    orderIndex: 0,
    estimatedOffsetMinutes: 0
  };

  constructor(
    private readonly firebasePhoneAuth: FirebasePhoneAuthService,
    private readonly authApi: AuthApiService,
    private readonly pilotApi: PilotApiService,
    private readonly pushNotifications: PushNotificationsService
  ) {}

  ionViewWillEnter(): void {
    if (!this.authApi.getAccessToken()) {
      return;
    }

    this.authApi.me().subscribe({
      next: (user) => {
        this.user = user;
        this.configureRoleTab();
        void this.pushNotifications.syncTokenAfterAuth();
        void this.bootstrapPilotData();
      },
      error: () => this.authApi.clearSession()
    });
  }

  async sendOtp(): Promise<void> {
    await this.runWithLoading(async () => {
      await this.firebasePhoneAuth.sendOtp(this.phoneNumber, 'recaptcha-container');
      this.step = 'otp';
    });
  }

  async verifyOtp(): Promise<void> {
    await this.runWithLoading(async () => {
      const firebaseIdToken = await this.firebasePhoneAuth.confirmOtp(this.otpCode);
      const response = await firstValueFrom(this.authApi.firebaseLogin(firebaseIdToken));
      this.user = response.user;
      this.configureRoleTab();
      void this.pushNotifications.syncTokenAfterAuth();
      await this.bootstrapPilotData();
    }, 'تم تسجيل الدخول');
  }

  completeProfile(): void {
    void this.runWithLoading(async () => {
      const response = await firstValueFrom(
        this.authApi.completeProfile({
          fullName: this.fullName,
          role: this.role,
          preferredLocale: 'ar'
        })
      );
      this.user = response.user;
      this.configureRoleTab();
      void this.pushNotifications.syncTokenAfterAuth();
      await this.bootstrapPilotData();
    }, 'تم حفظ الملف');
  }

  logout(): void {
    void this.pushNotifications.unregisterCurrentDevice();
    this.authApi.clearSession();
    this.user = null;
    this.step = 'phone';
    this.otpCode = '';
    this.searchResults = [];
    this.passengerBookings = [];
    this.driverBookings = [];
    this.myTrips = [];
  }

  async onTabChanged(): Promise<void> {
    await this.bootstrapPilotData();
  }

  async loadStopsForSelectedRoute(): Promise<void> {
    if (!this.selectedRouteId) return;
    await this.runWithLoading(async () => {
      this.stops = await firstValueFrom(this.pilotApi.listStops(this.selectedRouteId));
      this.pickupStopId = this.stops[0]?.id ?? '';
      this.dropoffStopId = this.stops[1]?.id ?? '';
    });
  }

  async searchTrips(): Promise<void> {
    if (!this.pickupStopId || !this.dropoffStopId) {
      this.errorMessage = 'اختر نقاط الصعود والنزول';
      return;
    }

    await this.runWithLoading(async () => {
      this.searchResults = await firstValueFrom(
        this.pilotApi.searchTrips(this.pickupStopId, this.dropoffStopId, this.searchDate)
      );
    });
  }

  async bookTrip(trip: Trip): Promise<void> {
    await this.runWithLoading(async () => {
      await firstValueFrom(
        this.pilotApi.createBooking({
          tripId: trip.id,
          pickupStopId: this.pickupStopId,
          dropoffStopId: this.dropoffStopId,
          seatsCount: Number(this.seatsCount)
        })
      );
      await this.loadPassengerData();
    }, 'تم إرسال طلب الحجز');
  }

  async loadPassengerData(): Promise<void> {
    const bookings = await firstValueFrom(this.pilotApi.listMyBookings());
    const views: PassengerBookingView[] = [];

    for (const booking of bookings) {
      const trip = await firstValueFrom(this.pilotApi.getTrip(booking.tripId));
      const driver =
        booking.status === 'accepted' || booking.status === 'completed'
          ? await this.safeDriverProfile(trip.driverId)
          : undefined;
      views.push({ booking, trip, driver });
      this.ratingForms[booking.tripId] ??= { rate: 5, comment: '' };
    }

    this.passengerBookings = views;
  }

  async rateTrip(booking: Booking): Promise<void> {
    const form = this.ratingForms[booking.tripId] ?? { rate: 5, comment: '' };
    await this.runWithLoading(async () => {
      await firstValueFrom(
        this.pilotApi.createRating({
          tripId: booking.tripId,
          rate: Number(form.rate),
          comment: form.comment || undefined
        })
      );
    }, 'تم إرسال التقييم');
  }

  async createTrip(): Promise<void> {
    await this.runWithLoading(async () => {
      await firstValueFrom(
        this.pilotApi.createTrip({
          routeId: this.driverTrip.routeId,
          tripDate: this.driverTrip.tripDate,
          startTime: this.driverTrip.startTime,
          totalSeats: Number(this.driverTrip.totalSeats),
          pricePerSeat: Number(this.driverTrip.pricePerSeat)
        })
      );
      await this.loadDriverData();
    }, 'تم نشر الرحلة');
  }

  async loadDriverData(): Promise<void> {
    try {
      this.myTrips = await firstValueFrom(this.pilotApi.listMyTrips());
      this.driverBookings = await firstValueFrom(this.pilotApi.listDriverBookings());
      this.driverProfileRequired = false;
      this.driverApprovalRequired = false;
    } catch (error) {
      if (this.isDriverProfileMissing(error)) {
        this.driverProfileRequired = true;
        this.driverApprovalRequired = false;
        this.myTrips = [];
        this.driverBookings = [];
        return;
      }
      if (this.isDriverApprovalMissing(error)) {
        this.driverProfileRequired = false;
        this.driverApprovalRequired = true;
        this.myTrips = [];
        this.driverBookings = [];
        return;
      }
      throw error;
    }
  }

  async registerDriverProfile(): Promise<void> {
    await this.runWithLoading(async () => {
      await firstValueFrom(
        this.pilotApi.registerDriver({
          nationalId: this.driverProfile.nationalId.trim(),
          licenseNumber: this.driverProfile.licenseNumber.trim(),
          carModel: this.driverProfile.carModel.trim(),
          carPlate: this.driverProfile.carPlate.trim(),
          carColor: this.driverProfile.carColor.trim()
        })
      );
      this.driverProfileRequired = false;
      this.driverApprovalRequired = true;
      await this.loadDriverData();
    }, 'تم تسجيل بيانات السائق. بانتظار اعتماد الإدارة.');
  }

  selectDriverDocuments(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.driverDocuments = Array.from(input.files ?? []);
  }

  async uploadDriverDocuments(): Promise<void> {
    if (this.driverDocuments.length < 2) {
      this.errorMessage = 'ارفع صورتين على الأقل للهوية والرخصة';
      return;
    }

    await this.runWithLoading(async () => {
      await firstValueFrom(this.pilotApi.uploadDriverDocuments(this.driverDocuments));
      this.driverDocuments = [];
    }, 'تم رفع المستندات. يمكن للإدارة اعتماد السائق الآن.');
  }

  async acceptBooking(bookingId: string): Promise<void> {
    await this.runWithLoading(async () => {
      await firstValueFrom(this.pilotApi.acceptBooking(bookingId));
      await this.loadDriverData();
    }, 'تم قبول الحجز');
  }

  async rejectBooking(bookingId: string): Promise<void> {
    await this.runWithLoading(async () => {
      await firstValueFrom(this.pilotApi.rejectBooking(bookingId));
      await this.loadDriverData();
    }, 'تم رفض الحجز');
  }

  async startTrip(tripId: string): Promise<void> {
    await this.runWithLoading(async () => {
      await firstValueFrom(this.pilotApi.startTrip(tripId));
      await this.loadDriverData();
    }, 'بدأت الرحلة');
  }

  async completeTrip(tripId: string): Promise<void> {
    await this.runWithLoading(async () => {
      await firstValueFrom(this.pilotApi.completeTrip(tripId));
      await this.loadDriverData();
    }, 'تم إكمال الرحلة');
  }

  async cancelTrip(tripId: string): Promise<void> {
    await this.runWithLoading(async () => {
      await firstValueFrom(this.pilotApi.cancelTrip(tripId));
      await this.loadDriverData();
    }, 'تم إلغاء الرحلة');
  }

  async sendMonitoringTest(): Promise<void> {
    Sentry.captureException(new Error('Deliberate frontend Sentry test error'));
    await this.runWithLoading(async () => {
      try {
        await firstValueFrom(this.pilotApi.triggerBackendMonitoringTest());
      } catch {
        return;
      }
    }, 'تم إرسال اختبار المراقبة');
  }

  async loadAdminData(): Promise<void> {
    await this.runWithLoading(async () => {
      this.routes = await firstValueFrom(this.pilotApi.listRoutes());
      this.adminStop.routeId ||= this.routes[0]?.id ?? '';
      const [drivers, trips, bookings] = await Promise.all([
        firstValueFrom(this.pilotApi.listPendingDrivers()),
        firstValueFrom(this.pilotApi.listAdminTrips()),
        firstValueFrom(this.pilotApi.listAdminBookings())
      ]);
      this.pendingDrivers = drivers;
      this.adminTrips = trips.data;
      this.adminBookings = bookings.data;
    });
  }

  async createAdminRoute(): Promise<void> {
    if (!this.adminRoute.name.trim()) {
      this.errorMessage = 'اكتب اسم المسار';
      return;
    }

    await this.runWithLoading(async () => {
      const route = await firstValueFrom(
        this.pilotApi.createAdminRoute({
          name: this.adminRoute.name.trim(),
          direction: this.adminRoute.direction,
          isActive: true
        })
      );
      this.adminRoute.name = '';
      this.adminStop.routeId = route.id;
      await this.loadAdminData();
    }, 'تمت إضافة المسار');
  }

  async createAdminStop(): Promise<void> {
    if (!this.adminStop.routeId || !this.adminStop.name.trim()) {
      this.errorMessage = 'اختر المسار واكتب اسم المحطة';
      return;
    }

    await this.runWithLoading(async () => {
      await firstValueFrom(
        this.pilotApi.createAdminStop(this.adminStop.routeId, {
          name: this.adminStop.name.trim(),
          orderIndex: Number(this.adminStop.orderIndex),
          estimatedOffsetMinutes: Number(this.adminStop.estimatedOffsetMinutes),
          isActive: true
        })
      );
      this.adminStop.name = '';
      this.adminStop.orderIndex += 1;
      await this.loadAdminData();
    }, 'تمت إضافة المحطة');
  }

  async approveDriver(driverId: string): Promise<void> {
    await this.runWithLoading(async () => {
      await firstValueFrom(this.pilotApi.approveDriver(driverId));
      await this.loadAdminData();
    }, 'تم اعتماد السائق');
  }

  async rejectDriver(driverId: string): Promise<void> {
    const reason = window.prompt('سبب الرفض؟')?.trim();
    if (!reason) return;

    await this.runWithLoading(async () => {
      await firstValueFrom(this.pilotApi.rejectDriver(driverId, reason));
      await this.loadAdminData();
    }, 'تم رفض السائق');
  }

  roleLabel(role: AuthUser['role']): string {
    const labels: Record<AuthUser['role'], string> = {
      passenger: 'راكب',
      driver: 'سائق',
      admin: 'مدير'
    };
    return labels[role];
  }

  statusLabel(status: Booking['status']): string {
    const labels: Record<Booking['status'], string> = {
      pending: 'قيد المراجعة',
      accepted: 'مقبول',
      rejected: 'مرفوض',
      cancelled: 'ملغي',
      completed: 'مكتمل',
      expired: 'منتهي'
    };
    return labels[status];
  }

  tripStatusLabel(status: Trip['status']): string {
    const labels: Record<Trip['status'], string> = {
      open: 'مفتوحة',
      started: 'بدأت',
      completed: 'مكتملة',
      cancelled: 'ملغية'
    };
    return labels[status];
  }

  badgeColor(status: Booking['status']): string {
    if (status === 'accepted' || status === 'completed') return 'success';
    if (status === 'rejected' || status === 'cancelled' || status === 'expired') return 'medium';
    return 'warning';
  }

  routeName(routeId?: string): string {
    return this.routes.find((route) => route.id === routeId)?.name ?? 'رحلة';
  }

  driverTripRoute(tripId: string): string | undefined {
    return this.myTrips.find((trip) => trip.id === tripId)?.routeId;
  }

  acceptedDriverPhone(item: PassengerBookingView): string {
    return item.booking.status === 'accepted' ? (item.driver?.phone ?? '') : '';
  }

  private async bootstrapPilotData(): Promise<void> {
    if (!this.user?.isActive) return;

    if (this.user.role === 'admin') {
      await this.loadAdminData();
      return;
    }

    await this.runWithLoading(async () => {
      this.routes = await firstValueFrom(this.pilotApi.listRoutes());
      this.selectedRouteId ||= this.routes[0]?.id ?? '';
      this.driverTrip.routeId ||= this.routes[0]?.id ?? '';
      if (this.selectedRouteId && this.stops.length === 0) {
        this.stops = await firstValueFrom(this.pilotApi.listStops(this.selectedRouteId));
        this.pickupStopId ||= this.stops[0]?.id ?? '';
        this.dropoffStopId ||= this.stops[1]?.id ?? '';
      }
      if (this.activeTab === 'passenger') {
        await this.loadPassengerData();
      } else {
        await this.loadDriverData();
      }
    });
  }

  private configureRoleTab(): void {
    if (!this.user) return;
    this.activeTab = this.user.role === 'driver' ? 'driver' : 'passenger';
  }

  private async safeDriverProfile(driverId: string): Promise<DriverProfile | undefined> {
    try {
      return await firstValueFrom(this.pilotApi.getDriverProfile(driverId));
    } catch {
      return undefined;
    }
  }

  private async runWithLoading(action: () => Promise<void>, successMessage = ''): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await action();
      this.successMessage = successMessage;
    } catch (error) {
      this.errorMessage = this.messageFromError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private messageFromError(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const response = error as { error?: { message?: string | string[] } };
      const message = response.error?.message;
      if (Array.isArray(message)) return message.join('، ');
      if (message) return message;
    }
    return error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
  }

  private isDriverProfileMissing(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('error' in error)) {
      return false;
    }

    const response = error as { error?: { statusCode?: number; message?: string | string[] } };
    const message = response.error?.message;
    return (
      response.error?.statusCode === 403 &&
      (message === 'Driver profile is required' ||
        (Array.isArray(message) && message.includes('Driver profile is required')))
    );
  }

  private isDriverApprovalMissing(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('error' in error)) {
      return false;
    }

    const response = error as { error?: { statusCode?: number; message?: string | string[] } };
    const message = response.error?.message;
    const approvalMessages = [
      'Only approved drivers can manage bookings',
      'Only approved drivers can manage trips'
    ];
    return (
      response.error?.statusCode === 403 &&
      (typeof message === 'string'
        ? approvalMessages.includes(message)
        : Array.isArray(message) && message.some((item) => approvalMessages.includes(item)))
    );
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
