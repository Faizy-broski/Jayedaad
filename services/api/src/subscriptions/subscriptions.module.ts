import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionTiersController } from './subscription-tiers.controller';
import { CreditPacksController } from './credit-packs.controller';
import { EntitlementsService } from './entitlements.service';
import { SubscriptionsRepository } from './subscriptions.repository';
import { SubscriptionTiersRepository } from './subscription-tiers.repository';
import { CreditPacksRepository } from './credit-packs.repository';
import { PaymentsRepository } from './payments.repository';
import { StripeService } from './stripe.service';
import { PlanLifecycleService } from './plan-lifecycle.service';

@Module({
  controllers: [SubscriptionsController, SubscriptionTiersController, CreditPacksController],
  providers: [
    EntitlementsService,
    SubscriptionsRepository,
    SubscriptionTiersRepository,
    CreditPacksRepository,
    PaymentsRepository,
    StripeService,
    PlanLifecycleService,
  ],
  exports: [EntitlementsService],
})
export class SubscriptionsModule {}
