import { Logger } from '@nestjs/common';
import { errorMessage } from './error-message';

export async function safeNotify(
  logger: Logger,
  eventName: string,
  contextLabel: string,
  send: () => Promise<void>
): Promise<void> {
  try {
    await send();
  } catch (error) {
    logger.warn(
      `Notification event ${eventName} failed after ${contextLabel} state changed: ${errorMessage(error)}`
    );
  }
}
