import { Module } from '@nestjs/common';
import { AgenciesController } from './agencies.controller';
import { AgenciesRepository } from './agencies.repository';
import { DocumentsModule } from '../documents/documents.module';
import { AgentsModule } from '../agents/agents.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DocumentsModule, AgentsModule, NotificationsModule],
  controllers: [AgenciesController],
  providers: [AgenciesRepository],
})
export class AgenciesModule {}
