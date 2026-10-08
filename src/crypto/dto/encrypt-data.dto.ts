import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsString, MaxLength } from 'class-validator';
import { ApiResponseDto } from '../../common/api-response.js';

export class GetEncryptDataDto {
  @ApiProperty({
    description: 'Plaintext payload to encrypt (0-2000 characters)',
    minLength: 0,
    maxLength: 2000,
    example: 'sensitive-message-to-protect',
  })
  @IsDefined()
  @IsString()
  @MaxLength(2000)
  payload: string;
}

export class EncryptResultDto {
  @ApiProperty({
    description: 'AES key string encrypted with the RSA private key (base64)',
    example: 'kQ1a...==',
  })
  data1: string;

  @ApiProperty({
    description: 'Payload encrypted with the random AES key (base64, IV + ciphertext)',
    example: 'nR8b...==',
  })
  data2: string;
}

export class EncryptResponseDto extends ApiResponseDto<EncryptResultDto | null> {
  @ApiProperty({ type: EncryptResultDto, nullable: true })
  declare data: EncryptResultDto | null;
}
