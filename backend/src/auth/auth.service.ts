import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User, UserRole } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthResponse, AuthResponseUser } from './auth.types';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { FirebaseAdminService } from './firebase-admin.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  async loginWithFirebase(firebaseIdToken: string, deviceId?: string): Promise<AuthResponse> {
    const decodedToken = await this.firebaseAdmin.verifyIdToken(firebaseIdToken);
    const phone = decodedToken.phone_number ?? null;

    const user = await this.prisma.user.upsert({
      where: { firebaseUid: decodedToken.uid },
      create: {
        firebaseUid: decodedToken.uid,
        phone,
        role: UserRole.passenger,
        isActive: false,
        preferredLocale: 'ar'
      },
      update: {
        ...(phone ? { phone } : {})
      }
    });

    return this.createSession(user, deviceId);
  }

  async loginAsDevAdmin(deviceId?: string): Promise<AuthResponse> {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException('Development admin login is disabled in production');
    }

    const user = await this.prisma.user.upsert({
      where: { firebaseUid: 'dev-admin' },
      create: {
        firebaseUid: 'dev-admin',
        fullName: 'مدير النظام',
        role: UserRole.admin,
        isActive: true,
        preferredLocale: 'ar'
      },
      update: {
        fullName: 'مدير النظام',
        role: UserRole.admin,
        isActive: true,
        preferredLocale: 'ar'
      }
    });

    return this.createSession(user, deviceId);
  }

  async refresh(refreshToken: string, deviceId?: string): Promise<AuthResponse> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const existingToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: true
      }
    });

    if (!existingToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: existingToken.id },
        data: { revokedAt: new Date() }
      });

      return this.createSession(existingToken.user, deviceId ?? existingToken.deviceId ?? undefined, tx);
    });
  }

  async getUser(userId: string): Promise<AuthResponseUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new UnauthorizedException('Authenticated user no longer exists');
    }

    return this.toResponseUser(user);
  }

  async completeProfile(userId: string, dto: CompleteProfileDto): Promise<AuthResponse> {
    if (dto.role === UserRole.admin) {
      throw new BadRequestException('Admin users must be created manually');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        role: dto.role,
        preferredLocale: dto.preferredLocale ?? 'ar',
        isActive: true
      }
    });

    return this.createSession(user);
  }

  private async createSession(
    user: User,
    deviceId?: string,
    tx: Prisma.TransactionClient = this.prisma
  ): Promise<AuthResponse> {
    const accessMinutes = this.config.get<number>('JWT_ACCESS_MINUTES', 20);
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        firebaseUid: user.firebaseUid,
        role: user.role,
        isActive: user.isActive
      },
      {
        secret: this.getAccessSecret(),
        expiresIn: `${accessMinutes}m`
      }
    );

    const refreshToken = randomBytes(48).toString('base64url');
    await tx.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashRefreshToken(refreshToken),
        deviceId,
        expiresAt: this.refreshExpiryDate()
      }
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: accessMinutes * 60,
      user: this.toResponseUser(user)
    };
  }

  private refreshExpiryDate(): Date {
    const refreshDays = this.config.get<number>('JWT_REFRESH_DAYS', 30);
    return new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private getAccessSecret(): string {
    const secret = this.config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new BadRequestException('JWT_ACCESS_SECRET must be configured');
    }
    return secret;
  }

  private toResponseUser(user: User): AuthResponseUser {
    return {
      id: user.id,
      firebaseUid: user.firebaseUid,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      preferredLocale: user.preferredLocale,
      createdAt: user.createdAt
    };
  }
}
