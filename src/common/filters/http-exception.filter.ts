import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: Record<string, any> | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, any>;
        message = resp.message || exception.message;

        // Extract class-validator errors if present
        if (Array.isArray(resp.message)) {
          message = 'Validation failed';
          const validationErrors: Record<string, string> = {};
          for (const item of resp.message) {
            if (typeof item === 'string') {
              const [field, ...rest] = item.split(' ');
              if (field && rest.length > 0) {
                validationErrors[field] = item;
              } else {
                validationErrors.general = item;
              }
            }
          }
          errors = Object.keys(validationErrors).length > 0 ? validationErrors : undefined;
        } else if (resp.errors) {
          errors = resp.errors;
        }
      } else {
        message = String(exceptionResponse);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    } else {
      this.logger.error('Unhandled unknown exception', exception);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      ...(errors ? { errors } : {}),
      timestamp: new Date().toISOString(),
    });
  }
}
