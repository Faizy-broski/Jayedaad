import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsRepository } from './listings.repository';
import { ListingMediaService } from './listing-media.service';
import { DocumentsModule } from '../documents/documents.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DealsModule } from '../deals/deals.module';

@Module({
  // SubscriptionsModule, not the other way around — PlanLifecycleService
  // (subscriptions module) deliberately talks to the listings table via
  // SupabaseService directly for its boost-revert sweep instead of
  // importing ListingsModule, so this dependency stays one-directional and
  // no forwardRef() is needed. DealsModule backs the new mark-sold/
  // mark-rented endpoints below — DealsModule has no dependency back on
  // ListingsModule, so this stays one-directional too.
  imports: [DocumentsModule, SubscriptionsModule, DealsModule],
  controllers: [ListingsController],
  providers: [ListingsRepository, ListingMediaService],
  exports: [ListingsRepository, ListingMediaService],
})
export class ListingsModule {}
