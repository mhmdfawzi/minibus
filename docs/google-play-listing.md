# Google Play Store Listing

This copy is ready to enter in Google Play Console once the production backend, Firebase app, screenshots, and privacy URL are finalized.

## App Details

- App name: نظام النقل
- Package name: `com.transport.mvp`
- Default language: Arabic
- Category: Maps & Navigation
- App type: App
- Pricing: Free
- Distribution: Egypt
- Contact email: replace with support email before submission
- Privacy policy URL: publish `docs/privacy-policy.md` as a public web page and paste its URL in Play Console

## Short Description

حجز مقعد على رحلات محلية ثابتة مع سائقين موثقين في دمياط.

## Full Description

نظام النقل يساعد الركاب والسائقين على تنظيم الرحلات المحلية الثابتة داخل نطاق التشغيل التجريبي في دمياط.

للركاب:
- اختر نقطة الصعود ونقطة النزول.
- ابحث عن الرحلات المتاحة في التاريخ المطلوب.
- أرسل طلب حجز مقعد أو أكثر.
- تابع حالة الحجز واحصل على رقم السائق بعد قبول الطلب.
- قيّم السائق بعد اكتمال الرحلة.

للسائقين:
- أنشئ رحلة على مسار معتمد.
- تابع طلبات الحجز الواردة.
- اقبل أو ارفض الطلبات.
- ابدأ الرحلة أو أكملها أو ألغيها عند الحاجة.

الدفع يتم نقداً خارج التطبيق. لا يدعم التطبيق الدفع الإلكتروني أو التتبع المباشر أو المحادثات داخل التطبيق في هذه النسخة.

## Release Notes

الإصدار الأول للتوسع بعد التجربة:
- تسجيل الدخول برقم الهاتف عبر Firebase.
- رحلات ثابتة ومسارات معتمدة.
- طلبات حجز مع تنبيهات فورية.
- لوحة تشغيل للسائق.
- تقييم السائق بعد اكتمال الرحلة.

## Data Safety Draft

Data collected:

- Phone number: authentication, account identification, support/contact after accepted booking.
- Name: user profile and booking/driver visibility.
- Device token: push notifications.
- Driver vehicle/document information: driver verification and passenger confidence.
- Trip, booking, route, and rating data: app functionality and operational oversight.
- Crash/error diagnostics: reliability monitoring.

Data shared:

- Phone number is shown to the passenger only after the driver accepts the booking.
- Crash/error data may be processed by Sentry if configured.
- Firebase processes phone authentication and push messaging data.

Security:

- Backend endpoints require JWT auth except health checks.
- Refresh tokens are stored hashed server-side.
- Sensitive release files are ignored by git.

Deletion:

- Account/data deletion process must be provided before public Play submission. Add the support email or web form URL here once operationally ready.

## Screenshot Plan

Capture Arabic screenshots on a real Android device after production config is in place:

1. Login phone screen.
2. Passenger trip search.
3. Passenger booking status with accepted driver phone.
4. Driver create trip.
5. Driver booking requests.
6. Rating after completed trip.

Recommended minimum: phone screenshots, portrait, 1080x1920 or native device resolution.
