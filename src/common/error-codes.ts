export const ErrorCode = {
  NONE: '',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  ENCRYPT_FAILED: 'ENCRYPT_FAILED',
  DECRYPT_FAILED: 'DECRYPT_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
