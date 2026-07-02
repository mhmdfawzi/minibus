import { ForbiddenException, Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  getHealth(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('sentry-test')
  testSentry(): never {
    if (this.config.get<string>('ENABLE_SENTRY_TEST_ENDPOINT') !== 'true') {
      throw new ForbiddenException('Sentry test endpoint is disabled');
    }

    throw new Error('Deliberate backend Sentry test error');
  }
}
