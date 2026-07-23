import { Module } from '@nestjs/common';
import { AgenciesController } from './agencies.controller';
import { AgenciesRepository } from './agencies.repository';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  controllers: [AgenciesController],
  providers: [AgenciesRepository],
})
export class AgenciesModule {}
