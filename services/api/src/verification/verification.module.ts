import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationRepository } from './verification.repository';
import { ListingsModule } from '../listings/listings.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ListingsModule, NotificationsModule],
  controllers: [VerificationController],
  providers: [VerificationRepository],
})
export class VerificationModule {}
