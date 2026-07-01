import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  firebaseUid: string;
  role: UserRole;
  isActive: boolean;
}

export interface AccessTokenPayload {
  sub: string;
  firebaseUid: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthResponseUser {
  id: string;
  firebaseUid: string;
  phone: string | null;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
  preferredLocale: string;
  createdAt: Date;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthResponseUser;
}
