import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsRepository } from './listings.repository';
import { ListingMediaService } from './listing-media.service';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  controllers: [ListingsController],
  providers: [ListingsRepository, ListingMediaService],
  exports: [ListingsRepository, ListingMediaService],
})
export class ListingsModule {}
