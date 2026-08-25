import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsRepository } from './agents.repository';
import { AvatarMediaService } from './avatar-media.service';
import { DocumentsModule } from '../documents/documents.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OwnersModule } from '../owners/owners.module';
import { DealsModule } from '../deals/deals.module';

@Module({
  // DealsModule backs the new GET :id/revenue endpoint below — no
  // dependency back the other way, so this stays one-directional.
  imports: [DocumentsModule, NotificationsModule, OwnersModule, DealsModule],
  controllers: [AgentsController],
  providers: [AgentsRepository, AvatarMediaService],
  exports: [AgentsRepository],
})
export class AgentsModule {}
