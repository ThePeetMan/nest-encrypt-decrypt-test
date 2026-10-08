import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { fail } from '../api-response.js';
import { ErrorCode } from '../error-codes.js';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof BadRequestException) {
      response
        .status(HttpStatus.BAD_REQUEST)
        .json(fail(ErrorCode.INVALID_PAYLOAD));
      return;
    }

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(fail(ErrorCode.INTERNAL_ERROR));
      return;
    }

    this.logger.error(exception);
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(fail(ErrorCode.INTERNAL_ERROR));
  }
}
