import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsRepository } from './agents.repository';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  controllers: [AgentsController],
  providers: [AgentsRepository],
})
export class AgentsModule {}
