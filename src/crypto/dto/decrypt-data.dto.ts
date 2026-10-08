import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { ApiResponseDto } from '../../common/api-response.js';

export class GetDecryptDataDto {
  @ApiProperty({
    description: 'RSA-OAEP encrypted AES-256 key (base64) from /get-encrypt-data',
    example: 'kQ1a...==',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  data1: string;

  @ApiProperty({
    description: 'AES-256-GCM ciphertext with IV and auth tag (base64)',
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
