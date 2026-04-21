import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

type ErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      const details = typeof response === 'string' ? undefined : response;
      const message = extractMessage(response, exception.message);

      const body: ErrorBody = {
        error: {
          code: statusToCode(status),
          message,
          details,
        },
      };

      res.status(status).json(body);
      return;
    }

    const body: ErrorBody = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
    };
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}

function statusToCode(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_ERROR';
    case 429:
      return 'RATE_LIMITED';
    default:
      return 'HTTP_ERROR';
  }
}

function extractMessage(response: unknown, fallback: string): string {
  if (typeof response === 'string') return response;
  if (!isRecord(response)) return fallback;

  const msg = response['message'];
  if (typeof msg === 'string') return msg;
  if (Array.isArray(msg) && msg.every((x) => typeof x === 'string')) {
    return msg.join(', ');
  }
  return fallback;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
