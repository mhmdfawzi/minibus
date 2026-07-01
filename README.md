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

## Notes

- `specs/database-schema-v2.md` is the source of truth for the Prisma schema.
- There is intentionally no `otp_requests` table. Phone OTP is handled by Firebase Authentication on the client.
- Business modules are scaffolded only; later phases should add behavior inside the existing module boundaries.
