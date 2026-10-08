import { Test, TestingModule } from '@nestjs/testing';
import { ErrorCode } from '../common/error-codes.js';
import { CryptoController } from './crypto.controller.js';
import { CryptoService } from './crypto.service.js';

describe('CryptoController', () => {
  let controller: CryptoController;
  let service: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CryptoController],
      providers: [CryptoService],
    }).compile();

    controller = module.get(CryptoController);
    service = module.get(CryptoService);
  });

  it('encrypts via POST /get-encrypt-data contract', () => {
    const result = controller.encrypt({ payload: 'controller-payload' });

    expect(result.successful).toBe(true);
    expect(result.error_code).toBe(ErrorCode.NONE);
    expect(result.data).toEqual({
      data1: expect.any(String),
      data2: expect.any(String),
    });
  });

  it('decrypts via POST /get-decrypt-data contract', () => {
    const encrypted = service.encrypt('controller-payload');
    const result = controller.decrypt({
      data1: encrypted.data!.data1,
      data2: encrypted.data!.data2,
    });

    expect(result).toEqual({
      successful: true,
      error_code: ErrorCode.NONE,
      data: { payload: 'controller-payload' },
    });
  });
});
