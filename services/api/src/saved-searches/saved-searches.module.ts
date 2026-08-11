import { Module } from '@nestjs/common';
import { SavedSearchesController } from './saved-searches.controller';
import { SavedSearchesRepository } from './saved-searches.repository';
import { SavedSearchAlertsService } from './saved-search-alerts.service';
import { ListingsModule } from '../listings/listings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailerService } from '../auth/otp/mailer.service';

@Module({
  imports: [ListingsModule, NotificationsModule],
  controllers: [SavedSearchesController],
  // MailerService re-declared here rather than exported from OtpModule —
  // same "cheap, stateless provider" convention PasswordResetModule already
  // uses for the same class.
  providers: [SavedSearchesRepository, SavedSearchAlertsService, MailerService],
})
export class SavedSearchesModule {}
