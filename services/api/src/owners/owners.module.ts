import { Module } from '@nestjs/common';
import { OwnersController } from './owners.controller';
import { OwnersRepository } from './owners.repository';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  controllers: [OwnersController],
  providers: [OwnersRepository],
  // AgentsModule injects this — an independent agent's identity check now
  // reuses OwnersRepository.getDocumentCompleteness() directly (see
  // AgentsRepository.setVerificationStatus) instead of a separate
  // agent-specific onboarding-document check.
  exports: [OwnersRepository],
})
export class OwnersModule {}
