# iOS Release Scope

The app is built with Ionic/Angular and Capacitor, so the UI and REST API layer are shared. iOS release work is still a separate follow-on phase because Apple signing, Firebase phone auth, and push entitlements have stricter setup requirements.

## Required Work

1. Apple Developer Program
   - Enroll the owner organization/person.
   - Create app identifier for `com.transport.mvp` or the final bundle id.
   - Configure signing certificates and provisioning profiles.

2. Capacitor iOS project
   - Add iOS platform with `npx cap add ios`.
   - Configure app name, bundle id, icons, splash screens, and deployment target.
   - Verify RTL layout and keyboard behavior on iPhone sizes.

3. Firebase
   - Add iOS app in Firebase.
   - Download `GoogleService-Info.plist`.
   - Configure APNs authentication key/certificate in Firebase.
   - Verify Firebase Phone Auth on iOS. iOS uses silent APNs flow where available, so APNs setup is not optional for production reliability.

4. Push notifications
   - Enable Push Notifications entitlement.
   - Enable Background Modes if needed for notification handling.
   - Confirm device token registration hits `POST /devices/register` with platform `ios`.

5. Sentry
   - Add iOS dSYM upload plan if using native crash reports.
   - Confirm deliberate frontend error reaches Sentry from a real iPhone.

6. App Store requirements
   - Privacy Nutrition Label.
   - Privacy policy public URL.
   - Support URL and marketing URL if applicable.
   - App Review demo account or phone-auth test flow.
   - Screenshots for required iPhone sizes.

## Risks To Resolve Early

- Phone OTP delivery and Firebase verification behavior on Egyptian iOS devices.
- APNs/Firebase configuration drift between development and production.
- App Review rejection if the app appears to coordinate paid transport without clear local compliance/support information.
- Any use of national ID/license document data requires a clear privacy/support process.

## Recommended Sequence

1. Finish Android Play release readiness.
2. Create Apple/Firebase iOS app records.
3. Add Capacitor iOS project.
4. Run login, push, booking, completion, rating, and Sentry smoke tests on one physical iPhone.
5. Prepare App Store metadata from the Play listing copy, adjusted for Apple privacy forms.
