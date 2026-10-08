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
      'Creates a random AES key string, encrypts the payload with that key (data2), then encrypts the AES key with the RSA private key (data1).',
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
      'Decrypts data1 with the RSA public key to recover the AES key string, then decrypts data2 back to the original payload.',
  })
  @ApiOkResponse({ type: DecryptResponseDto })
  decrypt(@Body() dto: GetDecryptDataDto): DecryptResponseDto {
    return this.cryptoService.decrypt(dto.data1, dto.data2);
  }
}
