import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SupabaseModule } from './supabase/supabase.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { UsersModule } from './users/users.module';
import { ListingsModule } from './listings/listings.module';
import { VerificationModule } from './verification/verification.module';
import { LeadsModule } from './leads/leads.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { TaxonomyModule } from './taxonomy/taxonomy.module';
import { AgenciesModule } from './agencies/agencies.module';
import { AgentsModule } from './agents/agents.module';
import { OwnersModule } from './owners/owners.module';
import { FavoritesModule } from './favorites/favorites.module';
import { SavedSearchesModule } from './saved-searches/saved-searches.module';
import { ProjectsModule } from './projects/projects.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PreferencesModule } from './preferences/preferences.module';
import { AccountModule } from './account/account.module';
import { AdminModule } from './admin/admin.module';
import { DevelopersModule } from './developers/developers.module';
import { ContactModule } from './contact/contact.module';
import { BlogModule } from './blog/blog.module';

@Module({
  imports: [
    // Generous global default (every route gets *some* protection) —
    // individual routes override it with stricter @Throttle() limits where
    // warranted (see auth/otp/otp.controller.ts).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    SupabaseModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    VerificationModule,
    LeadsModule,
    AppointmentsModule,
    SubscriptionsModule,
    ChatbotModule,
    TaxonomyModule,
    AgenciesModule,
    AgentsModule,
    OwnersModule,
    FavoritesModule,
    SavedSearchesModule,
    ProjectsModule,
    NotificationsModule,
    PreferencesModule,
    AccountModule,
    AdminModule,
    DevelopersModule,
    ContactModule,
    BlogModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
