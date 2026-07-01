# Transportation System MVP

Phase 0 foundation for the Damietta fixed-route transport MVP.

## Prerequisites

- Node.js 20+
- Docker and Docker Compose

## Local setup

```bash
npm install
cp .env.example backend/.env
docker-compose up -d
npm run prisma:migrate
npm run dev:backend
```

The backend listens on `http://localhost:3000`. `GET /health` returns `{ "status": "ok" }`.

Frontend development:

```bash
npm run dev:frontend
```

## Auth setup

Phone OTP is handled by Firebase Authentication on the client. The backend only verifies the Firebase ID token at `POST /auth/firebase-login`, then issues app access and refresh tokens.

Backend env:

- `JWT_ACCESS_SECRET`: long random secret for app access tokens.
- `JWT_ACCESS_MINUTES`: default `20`.
- `JWT_REFRESH_DAYS`: default `30`.
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`: Firebase Admin service account credentials. If omitted, Firebase Admin falls back to application-default credentials.

Frontend env:

- Fill `frontend/src/environments/environment.ts` with the Firebase web app config: `apiKey`, `authDomain`, `projectId`, and `appId`.
- Enable Firebase Phone Authentication in the Firebase console.
- Configure Firebase's required abuse protection for production phone auth: reCAPTCHA for web fallback, Play Integrity for Android, and APNs for iOS.
- Firebase Phone Authentication needs the project on the Blaze billing plan for real development and pilot testing.

New first-login users are created as inactive passenger placeholders because `users.role` is intentionally non-nullable. The app then calls `PATCH /auth/complete-profile` to set `full_name`, the selected one-account role (`passenger` or `driver`), and activate the account. Admin users are not self-serve; seed them manually in a later admin bootstrap step.

Before pilot use, test sign-in on a physical Android device with real Egyptian numbers, including at least Vodafone Egypt, Orange Egypt, Etisalat Misr, and WE where available.

## Admin Bootstrap

There is no self-serve admin signup. For a fresh environment, first sign in once through Firebase so a `users` row exists, then promote exactly one known Firebase UID:

```sql
UPDATE users
SET role = 'admin',
    is_active = true,
    full_name = COALESCE(full_name, 'Admin')
WHERE firebase_uid = '<firebase_uid>';
```

Confirm there is only one admin:

```sql
SELECT id, phone, firebase_uid, role, is_active
FROM users
WHERE role = 'admin';
```

All `/admin/*` endpoints require a valid app access token for an active user with `role = admin`.

## Driver Documents

`POST /drivers/documents` accepts multipart image files under the field name `documents`. Local development stores them under `backend/uploads/driver-documents` and saves `/uploads/...` URLs in `drivers.doc_urls`. Configure S3-compatible object storage before production/pilot use; approval requires at least two uploaded document URLs.

## Notes

- `specs/database-schema-v2.md` is the source of truth for the Prisma schema.
- There is intentionally no `otp_requests` table. Phone OTP is handled by Firebase Authentication on the client.
- Business modules are scaffolded only; later phases should add behavior inside the existing module boundaries.
