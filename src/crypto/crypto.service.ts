import { Injectable, Logger } from '@nestjs/common';
import {
  constants,
  createCipheriv,
  createDecipheriv,
  privateEncrypt,
  publicDecrypt,
  randomBytes,
} from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fail, ok, type ApiResponseDto } from '../common/api-response.js';
import { ErrorCode } from '../common/error-codes.js';
import type { DecryptResultDto } from './dto/decrypt-data.dto.js';
import type { EncryptResultDto } from './dto/encrypt-data.dto.js';

const AES_ALGORITHM = 'aes-256-cbc';
const AES_KEY_CHARS = 32;
const AES_IV_BYTES = 16;

function randomAesKeyString(): string {
  return randomBytes(AES_KEY_CHARS / 2).toString('hex');
}

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private readonly publicKey: string;
  private readonly privateKey: string;

  constructor() {
    const keysDir = join(process.cwd(), 'keys');
    this.publicKey = readFileSync(join(keysDir, 'public.pem'), 'utf8');
    this.privateKey = readFileSync(join(keysDir, 'private.pem'), 'utf8');
  }

  encrypt(payload: string): ApiResponseDto<EncryptResultDto | null> {
    try {
      const aesKey = randomAesKeyString();
      const iv = randomBytes(AES_IV_BYTES);
      const cipher = createCipheriv(
        AES_ALGORITHM,
        Buffer.from(aesKey, 'utf8'),
        iv,
      );
      const ciphertext = Buffer.concat([
        cipher.update(payload, 'utf8'),
        cipher.final(),
      ]);

      const data2 = Buffer.concat([iv, ciphertext]).toString('base64');
      const data1 = privateEncrypt(
        {
          key: this.privateKey,
          padding: constants.RSA_PKCS1_PADDING,
        },
        Buffer.from(aesKey, 'utf8'),
      ).toString('base64');

      return ok({ data1, data2 });
    } catch (error) {
      this.logger.error(error);
      return fail(ErrorCode.ENCRYPT_FAILED);
    }
  }

  decrypt(
    data1: string,
    data2: string,
  ): ApiResponseDto<DecryptResultDto | null> {
    try {
      const aesKey = publicDecrypt(
        {
          key: this.publicKey,
          padding: constants.RSA_PKCS1_PADDING,
        },
        Buffer.from(data1, 'base64'),
      ).toString('utf8');

      const packed = Buffer.from(data2, 'base64');
      if (packed.length <= AES_IV_BYTES) {
        return fail(ErrorCode.DECRYPT_FAILED);
      }

      const iv = packed.subarray(0, AES_IV_BYTES);
      const ciphertext = packed.subarray(AES_IV_BYTES);
      const decipher = createDecipheriv(
        AES_ALGORITHM,
        Buffer.from(aesKey, 'utf8'),
        iv,
      );
      const payload = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]).toString('utf8');

      return ok({ payload });
    } catch (error) {
      this.logger.error(error);
      return fail(ErrorCode.DECRYPT_FAILED);
    }
  }
}
