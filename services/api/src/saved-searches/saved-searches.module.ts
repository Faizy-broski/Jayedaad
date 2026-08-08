import { Module } from '@nestjs/common';
import { SavedSearchesController } from './saved-searches.controller';
import { SavedSearchesRepository } from './saved-searches.repository';
import { SavedSearchAlertsService } from './saved-search-alerts.service';
import { ListingsModule } from '../listings/listings.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ListingsModule, NotificationsModule],
  controllers: [SavedSearchesController],
  providers: [SavedSearchesRepository, SavedSearchAlertsService],
})
export class SavedSearchesModule {}
