import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { DriverStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { RegisterDriverDto } from './dto/register-driver.dto';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  async registerDriver(user: AuthenticatedUser, dto: RegisterDriverDto) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!dbUser || !dbUser.isActive || dbUser.role !== UserRole.driver) {
      throw new ForbiddenException('Only active driver accounts can register a driver profile');
    }

    try {
      return await this.prisma.driver.create({
        data: {
          userId: user.id,
          nationalId: dto.nationalId,
          licenseNumber: dto.licenseNumber,
          carModel: dto.carModel,
          carPlate: dto.carPlate,
          carColor: dto.carColor,
          status: DriverStatus.pending,
          docUrls: []
        }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Driver profile already exists or document identifiers are duplicated');
      }
      throw error;
    }
  }

  async addDocuments(user: AuthenticatedUser, documentUrls: string[]) {
    if (!documentUrls.length) {
      throw new BadRequestException('At least one document image is required');
    }

    const driver = await this.prisma.driver.findUnique({
      where: { userId: user.id }
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    if (driver.status === DriverStatus.approved) {
      throw new BadRequestException('Approved driver documents cannot be changed here');
    }

    const existingUrls = Array.isArray(driver.docUrls) ? driver.docUrls : [];
    const nextUrls = [...existingUrls.filter((url): url is string => typeof url === 'string'), ...documentUrls];

    return this.prisma.driver.update({
      where: { id: driver.id },
      data: { docUrls: nextUrls }
    });
  }

  async getPublicProfile(driverId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: {
          select: {
            fullName: true,
            phone: true
          }
        },
        ratings: {
          select: {
            rate: true
          }
        }
      }
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const ratingCount = driver.ratings.length;
    const ratingAverage =
      ratingCount === 0
        ? null
        : driver.ratings.reduce((sum, rating) => sum + rating.rate, 0) / ratingCount;

    return {
      id: driver.id,
      fullName: driver.user.fullName,
      phone: driver.user.phone,
      carModel: driver.carModel,
      carPlate: driver.carPlate,
      carColor: driver.carColor,
      status: driver.status,
      ratingAverage,
      ratingCount
    };
  }
}
