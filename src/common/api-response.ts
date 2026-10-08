import { ApiProperty } from '@nestjs/swagger';
import { ErrorCode } from './error-codes.js';

export class ApiResponseDto<T> {
  @ApiProperty({ description: 'Whether the operation succeeded' })
  successful: boolean;

  @ApiProperty({
    description: 'Empty string on success, otherwise a machine-readable error code',
    example: '',
  })
  error_code: string;

  data: T | null;
}

export function ok<T>(data: T): ApiResponseDto<T> {
  return {
    successful: true,
    error_code: ErrorCode.NONE,
    data,
  };
}

export function fail(errorCode: string): ApiResponseDto<null> {
  return {
    successful: false,
    error_code: errorCode,
    data: null,
  };
}
