import { QueryFailedError } from 'typeorm';

import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';

export class ErrorHandler {
  static handle(error: unknown, logger: Logger, context: string): never {
    if (error instanceof QueryFailedError) {
      logger.error(`Database error in ${context}: ${error.message}`);
      throw new BadRequestException('Database operation failed');
    }

    if (error instanceof Error) {
      logger.error(`Error in ${context}: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    // Handle unknown errors
    logger.error(`Unknown error in ${context}: ${error}`);
    throw new InternalServerErrorException('An unexpected error occurred');
  }
}
