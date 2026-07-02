export const configuration = () => ({
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3000),
  CORS_ORIGINS: process.env.CORS_ORIGINS ?? 'http://localhost:8100,http://127.0.0.1:8100',
  DATABASE_URL: process.env.DATABASE_URL,
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'log',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_DAYS: Number(process.env.JWT_REFRESH_DAYS ?? 30),
  JWT_ACCESS_MINUTES: Number(process.env.JWT_ACCESS_MINUTES ?? 20),
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  SENTRY_DSN: process.env.SENTRY_DSN,
  ENABLE_SENTRY_TEST_ENDPOINT: process.env.ENABLE_SENTRY_TEST_ENDPOINT
});
