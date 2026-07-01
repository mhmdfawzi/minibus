CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "UserRole" AS ENUM ('passenger', 'driver', 'admin');
CREATE TYPE "DriverStatus" AS ENUM ('pending', 'approved', 'suspended', 'rejected');
CREATE TYPE "RouteDirection" AS ENUM ('outbound', 'return');
CREATE TYPE "TripStatus" AS ENUM ('open', 'started', 'completed', 'cancelled');
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'accepted', 'rejected', 'cancelled', 'completed', 'expired');
CREATE TYPE "DevicePlatform" AS ENUM ('android', 'ios');
CREATE TYPE "NotificationType" AS ENUM ('booking_created', 'booking_accepted', 'booking_rejected', 'booking_cancelled', 'trip_cancelled', 'trip_started');

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "firebase_uid" TEXT NOT NULL,
  "phone" TEXT,
  "full_name" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'passenger',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "preferred_locale" TEXT NOT NULL DEFAULT 'ar',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refresh_tokens" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "token_hash" TEXT NOT NULL,
  "device_id" TEXT,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "revoked_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "drivers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "national_id" TEXT NOT NULL,
  "license_number" TEXT NOT NULL,
  "car_model" TEXT NOT NULL,
  "car_plate" TEXT NOT NULL,
  "car_color" TEXT NOT NULL,
  "doc_urls" JSONB NOT NULL DEFAULT '[]'::JSONB,
  "status" "DriverStatus" NOT NULL DEFAULT 'pending',
  "rejection_reason" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "routes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "direction" "RouteDirection" NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "route_stops" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "route_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "order_index" INTEGER NOT NULL,
  "estimated_offset_minutes" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trips" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "route_id" UUID NOT NULL,
  "driver_id" UUID NOT NULL,
  "trip_date" DATE NOT NULL,
  "start_time" TIME(0) NOT NULL,
  "total_seats" INTEGER NOT NULL,
  "available_seats" INTEGER NOT NULL,
  "price_per_seat" DECIMAL(10,2) NOT NULL,
  "status" "TripStatus" NOT NULL DEFAULT 'open',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trips_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "trips_seat_bounds_check" CHECK ("available_seats" >= 0 AND "available_seats" <= "total_seats"),
  CONSTRAINT "trips_total_seats_positive_check" CHECK ("total_seats" > 0),
  CONSTRAINT "trips_price_per_seat_nonnegative_check" CHECK ("price_per_seat" >= 0)
);

CREATE TABLE "bookings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "trip_id" UUID NOT NULL,
  "passenger_id" UUID NOT NULL,
  "pickup_stop_id" UUID NOT NULL,
  "dropoff_stop_id" UUID NOT NULL,
  "seats_count" INTEGER NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'pending',
  "hold_expires_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bookings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bookings_seats_count_positive_check" CHECK ("seats_count" > 0),
  CONSTRAINT "bookings_price_nonnegative_check" CHECK ("price" >= 0)
);

CREATE TABLE "ratings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "trip_id" UUID NOT NULL,
  "passenger_id" UUID NOT NULL,
  "driver_id" UUID NOT NULL,
  "rate" INTEGER NOT NULL,
  "comment" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ratings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ratings_rate_bounds_check" CHECK ("rate" BETWEEN 1 AND 5)
);

CREATE TABLE "device_tokens" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "token" TEXT NOT NULL,
  "platform" "DevicePlatform" NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_firebase_uid_key" ON "users"("firebase_uid");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE INDEX "users_firebase_uid_idx" ON "users"("firebase_uid");
CREATE INDEX "users_phone_idx" ON "users"("phone");
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");
CREATE UNIQUE INDEX "drivers_user_id_key" ON "drivers"("user_id");
CREATE UNIQUE INDEX "drivers_national_id_key" ON "drivers"("national_id");
CREATE UNIQUE INDEX "drivers_license_number_key" ON "drivers"("license_number");
CREATE INDEX "drivers_status_idx" ON "drivers"("status");
CREATE INDEX "routes_is_active_idx" ON "routes"("is_active");
CREATE UNIQUE INDEX "route_stops_route_id_order_index_key" ON "route_stops"("route_id", "order_index");
CREATE INDEX "route_stops_route_id_is_active_idx" ON "route_stops"("route_id", "is_active");
CREATE INDEX "trips_route_id_trip_date_status_idx" ON "trips"("route_id", "trip_date", "status");
CREATE INDEX "trips_driver_id_status_idx" ON "trips"("driver_id", "status");
CREATE INDEX "bookings_passenger_id_status_idx" ON "bookings"("passenger_id", "status");
CREATE INDEX "bookings_trip_id_status_idx" ON "bookings"("trip_id", "status");
CREATE INDEX "bookings_status_hold_expires_at_idx" ON "bookings"("status", "hold_expires_at");
CREATE UNIQUE INDEX "bookings_one_active_per_passenger_trip_idx" ON "bookings"("trip_id", "passenger_id") WHERE "status" IN ('pending', 'accepted');
CREATE UNIQUE INDEX "ratings_trip_id_passenger_id_key" ON "ratings"("trip_id", "passenger_id");
CREATE INDEX "ratings_driver_id_idx" ON "ratings"("driver_id");
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");
CREATE INDEX "device_tokens_user_id_idx" ON "device_tokens"("user_id");
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trips" ADD CONSTRAINT "trips_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_passenger_id_fkey" FOREIGN KEY ("passenger_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_pickup_stop_id_fkey" FOREIGN KEY ("pickup_stop_id") REFERENCES "route_stops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_dropoff_stop_id_fkey" FOREIGN KEY ("dropoff_stop_id") REFERENCES "route_stops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_passenger_id_fkey" FOREIGN KEY ("passenger_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
