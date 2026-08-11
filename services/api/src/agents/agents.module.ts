import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsRepository } from './agents.repository';
import { AvatarMediaService } from './avatar-media.service';
import { DocumentsModule } from '../documents/documents.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OwnersModule } from '../owners/owners.module';

@Module({
  imports: [DocumentsModule, NotificationsModule, OwnersModule],
  controllers: [AgentsController],
  providers: [AgentsRepository, AvatarMediaService],
  exports: [AgentsRepository],
})
export class AgentsModule {}
