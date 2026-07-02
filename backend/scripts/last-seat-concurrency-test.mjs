const requiredEnv = [
  'API_BASE_URL',
  'PASSENGER_TOKEN_A',
  'PASSENGER_TOKEN_B',
  'TRIP_ID',
  'PICKUP_STOP_ID',
  'DROPOFF_STOP_ID'
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`Missing env: ${missingEnv.join(', ')}`);
  process.exit(2);
}

const body = JSON.stringify({
  tripId: process.env.TRIP_ID,
  pickupStopId: process.env.PICKUP_STOP_ID,
  dropoffStopId: process.env.DROPOFF_STOP_ID,
  seatsCount: 1
});

const responses = await Promise.all(
  [process.env.PASSENGER_TOKEN_A, process.env.PASSENGER_TOKEN_B].map(
    async (token) => {
      const response = await fetch(`${process.env.API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body
      });

      return {
        status: response.status,
        body: await response.json()
      };
    }
  )
);

console.log(JSON.stringify(responses, null, 2));

const successCount = responses.filter((response) => response.status === 201).length;
if (successCount !== 1) {
  console.error(`Expected exactly one booking to succeed, got ${successCount}`);
  process.exit(1);
}

console.log('Last-seat concurrency check passed.');
