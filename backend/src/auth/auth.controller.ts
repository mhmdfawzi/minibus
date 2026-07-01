import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResponse, AuthResponseUser, AuthenticatedUser } from './auth.types';
import { CurrentUser } from './current-user.decorator';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { FirebaseLoginDto } from './dto/firebase-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('firebase-login')
  firebaseLogin(@Body() dto: FirebaseLoginDto): Promise<AuthResponse> {
    return this.authService.loginWithFirebase(dto.firebaseIdToken, dto.deviceId);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponse> {
    return this.authService.refresh(dto.refreshToken, dto.deviceId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser): Promise<AuthResponseUser> {
    return this.authService.getUser(user.id);
  }

  @Patch('complete-profile')
  @UseGuards(JwtAuthGuard)
  completeProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CompleteProfileDto
  ): Promise<AuthResponse> {
    return this.authService.completeProfile(user.id, dto);
  }
}
