import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationRepository } from './verification.repository';
import { ListingsModule } from '../listings/listings.module';

@Module({
  imports: [ListingsModule],
  controllers: [VerificationController],
  providers: [VerificationRepository],
})
export class VerificationModule {}
