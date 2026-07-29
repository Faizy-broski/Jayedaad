import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ScopeGuard } from '../common/guards/scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { EntitlementsService } from './entitlements.service';
import { SubscriptionsRepository } from './subscriptions.repository';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly entitlements: EntitlementsService,
    private readonly subscriptions: SubscriptionsRepository,
  ) {}

  // "40 of 50 listings used" — real-time usage tracking [Spec §6/§8.1].
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Get('usage')
  usage(@Req() req: any) {
    return this.entitlements.getListingUsage(req.user.agentId);
  }

  // The agent's own current plan — findForAgent() already existed but was
  // never wired to a route (Current Plan showed a hardcoded "-" on the
  // dashboard because nothing ever fetched this).
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Get('me')
  me(@Req() req: any) {
    return this.subscriptions.findForAgent(req.user.agentId);
  }

  // Self-service plan selection — this app has no payment/billing
  // integration anywhere, so "upgrade" is a real, immediate tier change
  // (same upsert the super_admin assign route uses), not a checkout flow.
  // Flagged in the Plan page UI as not being a real billing transaction.
  @UseGuards(ScopeGuard)
  @Roles('agent')
  @Post('me/select')
  select(@Req() req: any, @Body() body: AssignSubscriptionDto) {
    return this.subscriptions.assign(req.user.agentId, body);
  }

  // Super Admin assigns/changes an agent's plan — the write side that was
  // entirely missing; nothing ever populated `subscriptions` before this.
  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch(':agentId/assign')
  assign(@Param('agentId') agentId: string, @Body() body: AssignSubscriptionDto) {
    return this.subscriptions.assign(agentId, body);
  }
}
