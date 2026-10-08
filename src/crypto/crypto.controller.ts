import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CryptoService } from './crypto.service.js';
import {
  DecryptResponseDto,
  GetDecryptDataDto,
} from './dto/decrypt-data.dto.js';
import {
  EncryptResponseDto,
  GetEncryptDataDto,
} from './dto/encrypt-data.dto.js';

@ApiTags('crypto')
@Controller()
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Post('get-encrypt-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Encrypt a payload',
    description:
      'Encrypts the payload with AES-256-GCM and wraps the AES key with RSA-OAEP (SHA-256) using the service public key.',
  })
  @ApiOkResponse({ type: EncryptResponseDto })
  encrypt(@Body() dto: GetEncryptDataDto): EncryptResponseDto {
    return this.cryptoService.encrypt(dto.payload);
  }

  @Post('get-decrypt-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Decrypt data1 and data2',
    description:
      'Unwraps the AES key from data1 with the RSA private key, then decrypts data2 back to the original payload.',
  })
  @ApiOkResponse({ type: DecryptResponseDto })
  decrypt(@Body() dto: GetDecryptDataDto): DecryptResponseDto {
    return this.cryptoService.decrypt(dto.data1, dto.data2);
  }
}
