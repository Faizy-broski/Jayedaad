import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsRepository } from './listings.repository';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  controllers: [ListingsController],
  providers: [ListingsRepository],
  exports: [ListingsRepository],
})
export class ListingsModule {}
