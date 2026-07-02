import { Rating } from '@prisma/client';

export interface RatingResponse {
  id: string;
  tripId: string;
  passengerId: string;
  driverId: string;
  rate: number;
  comment: string | null;
  createdAt: Date;
  passenger?: {
    fullName: string | null;
  };
}

type RatingWithPassenger = Rating & {
  passenger?: {
    fullName: string | null;
  };
};

export function toRatingResponse(rating: RatingWithPassenger): RatingResponse {
  return {
    id: rating.id,
    tripId: rating.tripId,
    passengerId: rating.passengerId,
    driverId: rating.driverId,
    rate: rating.rate,
    comment: rating.comment,
    createdAt: rating.createdAt,
    ...(rating.passenger
      ? {
          passenger: {
            fullName: rating.passenger.fullName
          }
        }
      : {})
  };
}
