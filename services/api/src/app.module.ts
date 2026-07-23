import { Module } from '@nestjs/common';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { UsersModule } from './users/users.module';
import { ListingsModule } from './listings/listings.module';
import { VerificationModule } from './verification/verification.module';
import { LeadsModule } from './leads/leads.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { TaxonomyModule } from './taxonomy/taxonomy.module';
import { AgenciesModule } from './agencies/agencies.module';
import { AgentsModule } from './agents/agents.module';
import { FavoritesModule } from './favorites/favorites.module';
import { SavedSearchesModule } from './saved-searches/saved-searches.module';
import { ProjectsModule } from './projects/projects.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PreferencesModule } from './preferences/preferences.module';
import { AdminModule } from './admin/admin.module';
import { DevelopersModule } from './developers/developers.module';

@Module({
  imports: [
    SupabaseModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    VerificationModule,
    LeadsModule,
    SubscriptionsModule,
    ChatbotModule,
    TaxonomyModule,
    AgenciesModule,
    AgentsModule,
    FavoritesModule,
    SavedSearchesModule,
    ProjectsModule,
    NotificationsModule,
    PreferencesModule,
    AdminModule,
    DevelopersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
