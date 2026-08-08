import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionTiersController } from './subscription-tiers.controller';
import { EntitlementsService } from './entitlements.service';
import { SubscriptionsRepository } from './subscriptions.repository';
import { SubscriptionTiersRepository } from './subscription-tiers.repository';
import { StripeService } from './stripe.service';
import { PlanLifecycleService } from './plan-lifecycle.service';

@Module({
  controllers: [SubscriptionsController, SubscriptionTiersController],
  providers: [EntitlementsService, SubscriptionsRepository, SubscriptionTiersRepository, StripeService, PlanLifecycleService],
  exports: [EntitlementsService],
})
export class SubscriptionsModule {}
