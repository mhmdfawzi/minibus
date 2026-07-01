import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { DriversService } from './drivers.service';

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const uploadRoot = join(process.cwd(), 'uploads', 'driver-documents');

@Controller('drivers')
@UseGuards(JwtAuthGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post('register')
  register(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterDriverDto
  ) {
    return this.driversService.registerDriver(user, dto);
  }

  @Post('documents')
  @UseInterceptors(
    FilesInterceptor('documents', 4, {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        if (!allowedImageTypes.has(file.mimetype)) {
          callback(new BadRequestException('Only jpeg, png, or webp images are allowed'), false);
          return;
        }

        callback(null, true);
      },
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          mkdirSync(uploadRoot, { recursive: true });
          callback(null, uploadRoot);
        },
        filename: (_request, file, callback) => {
          const safeExt = extname(file.originalname).toLowerCase();
          const uniqueName = `${Date.now()}-${randomUUID()}${safeExt}`;
          callback(null, uniqueName);
        }
      })
    })
  )
  uploadDocuments(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    const documentUrls = files.map((file) => `/uploads/driver-documents/${file.filename}`);
    return this.driversService.addDocuments(user, documentUrls);
  }

  @Get(':id')
  getDriverProfile(@Param('id') driverId: string) {
    return this.driversService.getPublicProfile(driverId);
  }
}
