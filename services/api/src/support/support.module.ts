import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { SupportController } from './support.controller';
import { SupportRepository } from './support.repository';

@Module({
  imports: [NotificationsModule],
  controllers: [SupportController],
  providers: [SupportRepository],
})
export class SupportModule {}
