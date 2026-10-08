import { Module } from '@nestjs/common';
import { CryptoController } from './crypto.controller.js';
import { CryptoService } from './crypto.service.js';

@Module({
  controllers: [CryptoController],
  providers: [CryptoService],
})
export class CryptoModule {}
