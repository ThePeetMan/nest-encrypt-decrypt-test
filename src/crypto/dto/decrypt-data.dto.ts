import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { ApiResponseDto } from '../../common/api-response.js';

export class GetDecryptDataDto {
  @ApiProperty({
    description: 'AES key string encrypted with the RSA private key (base64)',
    example: 'kQ1a...==',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  data1: string;

  @ApiProperty({
    description: 'Payload encrypted with the AES key (base64, IV + ciphertext)',
    example: 'nR8b...==',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  data2: string;
}

export class DecryptResultDto {
  @ApiProperty({
    description: 'Original plaintext payload',
    example: 'sensitive-message-to-protect',
  })
  payload: string;
}

export class DecryptResponseDto extends ApiResponseDto<DecryptResultDto | null> {
  @ApiProperty({ type: DecryptResultDto, nullable: true })
  declare data: DecryptResultDto | null;
}
