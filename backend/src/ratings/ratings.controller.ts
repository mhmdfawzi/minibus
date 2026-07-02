import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingResponse } from './rating.types';
import { RatingsService } from './ratings.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post('ratings')
  createRating(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRatingDto
  ): Promise<RatingResponse> {
    return this.ratingsService.createRating(user, dto);
  }

  @Get('drivers/:id/ratings')
  listDriverRatings(@Param('id') driverId: string): Promise<RatingResponse[]> {
    return this.ratingsService.listDriverRatings(driverId);
  }
}
