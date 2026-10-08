import { Injectable, Logger } from '@nestjs/common';
import {
  constants,
  createCipheriv,
  createDecipheriv,
  privateDecrypt,
  publicEncrypt,
  randomBytes,
} from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fail, ok, type ApiResponseDto } from '../common/api-response.js';
import { ErrorCode } from '../common/error-codes.js';
import type { DecryptResultDto } from './dto/decrypt-data.dto.js';
import type { EncryptResultDto } from './dto/encrypt-data.dto.js';

const AES_ALGORITHM = 'aes-256-gcm';
const AES_KEY_BYTES = 32;
const AES_IV_BYTES = 12;
const AES_TAG_BYTES = 16;
const RSA_OAEP_HASH = 'sha256';

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
      const aesKey = randomBytes(AES_KEY_BYTES);
      const iv = randomBytes(AES_IV_BYTES);
      const cipher = createCipheriv(AES_ALGORITHM, aesKey, iv);
      const ciphertext = Buffer.concat([
        cipher.update(payload, 'utf8'),
        cipher.final(),
      ]);
      const tag = cipher.getAuthTag();

      const data2 = Buffer.concat([iv, tag, ciphertext]).toString('base64');
      const data1 = publicEncrypt(
        {
          key: this.publicKey,
          padding: constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: RSA_OAEP_HASH,
        },
        aesKey,
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
      const aesKey = privateDecrypt(
        {
          key: this.privateKey,
          padding: constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: RSA_OAEP_HASH,
        },
        Buffer.from(data1, 'base64'),
      );

      const packed = Buffer.from(data2, 'base64');
      if (packed.length < AES_IV_BYTES + AES_TAG_BYTES) {
        return fail(ErrorCode.DECRYPT_FAILED);
      }

      const iv = packed.subarray(0, AES_IV_BYTES);
      const tag = packed.subarray(AES_IV_BYTES, AES_IV_BYTES + AES_TAG_BYTES);
      const ciphertext = packed.subarray(AES_IV_BYTES + AES_TAG_BYTES);

      const decipher = createDecipheriv(AES_ALGORITHM, aesKey, iv);
      decipher.setAuthTag(tag);
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
