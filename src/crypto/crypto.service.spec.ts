import { constants, publicDecrypt } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Test, TestingModule } from '@nestjs/testing';
import { ErrorCode } from '../common/error-codes.js';
import { CryptoService } from './crypto.service.js';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoService],
    }).compile();

    service = module.get(CryptoService);
  });

  it('round-trips a payload through encrypt then decrypt', () => {
    const payload = 'hello-hybrid-crypto';
    const encrypted = service.encrypt(payload);

    expect(encrypted.successful).toBe(true);
    expect(encrypted.error_code).toBe(ErrorCode.NONE);
    expect(encrypted.data?.data1).toBeTruthy();
    expect(encrypted.data?.data2).toBeTruthy();

    const decrypted = service.decrypt(
      encrypted.data!.data1,
      encrypted.data!.data2,
    );

    expect(decrypted).toEqual({
      successful: true,
      error_code: ErrorCode.NONE,
      data: { payload },
    });
  });

  it('supports an empty payload (0 characters)', () => {
    const encrypted = service.encrypt('');
    const decrypted = service.decrypt(
      encrypted.data!.data1,
      encrypted.data!.data2,
    );

    expect(decrypted.data?.payload).toBe('');
  });

  it('supports a 2000-character payload', () => {
    const payload = 'a'.repeat(2000);
    const encrypted = service.encrypt(payload);
    const decrypted = service.decrypt(
      encrypted.data!.data1,
      encrypted.data!.data2,
    );

    expect(decrypted.successful).toBe(true);
    expect(decrypted.data?.payload).toBe(payload);
  });

  it('supports unicode payloads', () => {
    const payload = 'ข้อความลับ 🔐 café';
    const encrypted = service.encrypt(payload);
    const decrypted = service.decrypt(
      encrypted.data!.data1,
      encrypted.data!.data2,
    );

    expect(decrypted.data?.payload).toBe(payload);
  });

  it('creates a random AES key string and encrypts it with the private key as data1', () => {
    const encrypted = service.encrypt('payload');
    const publicKey = readFileSync(join(process.cwd(), 'keys', 'public.pem'), 'utf8');
    const aesKey = publicDecrypt(
      {
        key: publicKey,
        padding: constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(encrypted.data!.data1, 'base64'),
    ).toString('utf8');

    expect(aesKey).toMatch(/^[0-9a-f]{32}$/);
  });

  it('produces different ciphertext for the same payload (random AES key/IV)', () => {
    const first = service.encrypt('same-payload');
    const second = service.encrypt('same-payload');

    expect(first.data?.data1).not.toBe(second.data?.data1);
    expect(first.data?.data2).not.toBe(second.data?.data2);
  });

  it('fails decryption when data1 is not a valid RSA ciphertext', () => {
    const encrypted = service.encrypt('payload');
    const result = service.decrypt('not-valid-base64-rsa!!!', encrypted.data!.data2);

    expect(result).toEqual({
      successful: false,
      error_code: ErrorCode.DECRYPT_FAILED,
      data: null,
    });
  });

  it('fails decryption when data2 is truncated', () => {
    const encrypted = service.encrypt('payload');
    const result = service.decrypt(encrypted.data!.data1, Buffer.from('short').toString('base64'));

    expect(result.error_code).toBe(ErrorCode.DECRYPT_FAILED);
    expect(result.successful).toBe(false);
    expect(result.data).toBeNull();
  });

  it('fails decryption when data2 is tampered with', () => {
    const encrypted = service.encrypt('payload');
    const packed = Buffer.from(encrypted.data!.data2, 'base64');
    packed[packed.length - 1] ^= 0xff;
    const tampered = packed.toString('base64');

    const result = service.decrypt(encrypted.data!.data1, tampered);

    expect(result.error_code).toBe(ErrorCode.DECRYPT_FAILED);
    expect(result.successful).toBe(false);
  });
});
