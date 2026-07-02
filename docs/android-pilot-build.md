# Android Pilot Build

This project is configured for direct APK pilot distribution with Capacitor Android.

## Required local files

Create these files locally. They are intentionally ignored by git.

0. Android SDK path
   - Install Android Studio or Android command line tools.
   - Set `ANDROID_HOME`, or create `frontend/android/local.properties`:

```properties
sdk.dir=/absolute/path/to/Android/sdk
```

1. `frontend/android/app/google-services.json`
   - Download it from the Firebase project for app id `com.transport.mvp`.
   - Required for FCM push notifications on Android.

2. `frontend/android/signing.properties`
   - Copy `frontend/android/signing.properties.example`.
   - Point `storeFile` at a release keystore under `frontend/android/app/`.

## Create a release keystore

```bash
cd frontend/android
keytool -genkeypair \
  -v \
  -keystore app/transport-pilot-release.jks \
  -alias transport-pilot \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
cp signing.properties.example signing.properties
```

Edit `signing.properties` with the keystore and key passwords.

## Configure runtime endpoints

Set these before building a pilot APK:

- `frontend/src/environments/environment.ts`
  - `apiBaseUrl`: public HTTPS backend URL.
  - `firebase`: Firebase Web config used by phone auth.
  - `sentryDsn`: Sentry DSN for client errors.
- Backend environment:
  - `SENTRY_DSN`: Sentry DSN for backend errors.
  - `ENABLE_SENTRY_TEST_ENDPOINT=true`: enable only while verifying monitoring, then remove/disable it.
  - Firebase Admin credentials and database/JWT settings from earlier phases.

## Build signed APK

```bash
npm run build --workspace frontend
cd frontend
npx cap sync android
cd android
./gradlew assembleRelease
```

The signed APK will be at:

```text
frontend/android/app/build/outputs/apk/release/app-release.apk
```

## Pilot smoke test

Before sharing the APK:

1. Install on a real Android device.
2. Log in with Firebase phone auth.
3. Confirm device token is stored through `POST /devices/register`.
4. Driver creates a trip.
5. Passenger searches, books, and sees the booking.
6. Driver accepts; passenger sees driver phone number.
7. Driver starts and completes the trip.
8. Passenger submits one rating.
9. Confirm push notifications arrive while app is foregrounded and after tapping from background.
10. Trigger a controlled frontend/backend error and confirm Sentry receives both events.
