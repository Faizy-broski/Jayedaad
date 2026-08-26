import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ScopeGuard } from '../common/guards/scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRepository } from './admin.repository';
import { RevenueRepository } from './revenue.repository';
import { ROLE_ACCESS_DESCRIPTIONS } from './role-access-descriptions';
import { DealsRepository, RevenuePeriod } from '../deals/deals.repository';

// Super Admin-only platform rollup — everything else this session is scoped
// to a single agent/agency; nothing until now gives a whole-platform view.
@UseGuards(ScopeGuard)
@Roles('super_admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminRepository,
    private readonly revenue: RevenueRepository,
    private readonly deals: DealsRepository,
  ) {}

  @Get('stats')
  getStats() {
    return this.admin.getPlatformStats();
  }

  // Real earnings (from the payments ledger, 0065_payments_ledger.sql) —
  // subscription and credit revenue kept as two separate totals, plus a
  // per-tier breakdown (revenue + current active-subscriber count) sorted
  // by active-subscriber count so the "top" plan is the one with the most
  // people on it right now, not just the most historical revenue.
  @Get('revenue')
  async getRevenue() {
    const [summary, tierBreakdown] = await Promise.all([this.revenue.getRevenueSummary(), this.revenue.getTierBreakdown()]);
    const topTiers = [...tierBreakdown].sort((a, b) => b.activeSubscribers - a.activeSubscribers);
    return { ...summary, tierBreakdown, topTiers };
  }

  @Get('agents')
  listAgents(
    @Query('search') search?: string,
    @Query('verificationStatus') verificationStatus?: string,
    @Query('reviewableOnly') reviewableOnly?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.admin.listAgentsOverview({
      search,
      verificationStatus,
      reviewableOnly: reviewableOnly === 'true',
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get('agencies')
  listAgencies(
    @Query('search') search?: string,
    @Query('verificationStatus') verificationStatus?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.admin.listAgenciesOverview({
      search,
      verificationStatus,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  // Real commission revenue for one agency, aggregated across every one of
  // its staff members directly by agency_id — closes the gap where the
  // only existing revenue route (GET /agents/:id/revenue?scope=agency) is
  // anchored to one agent's id, awkward for a Super Admin who has picked an
  // agency, not a specific staff member, to view. Super Admin-only (class
  // guard above), no per-row ownership check needed the way
  // assertCanViewAgentRevenue enforces for the agent-facing route.
  @Get('agencies/:id/revenue')
  getAgencyRevenue(@Param('id') id: string, @Query('period') period?: RevenuePeriod) {
    return this.deals.getAgencyRevenue(id, { period: period ?? 'month' });
  }

  // "Which role gets what dashboard access" reference for the team
  // management screen — see role-access-descriptions.ts. Method-level
  // override (widening past the class-level super_admin-only guard, same
  // mechanism verification.controller.ts's auditLog() already uses) so
  // verification_staff's own shell can resolve its own role's label/
  // description too, instead of a hardcoded string — purely descriptive
  // static data, not sensitive, safe to open past super_admin.
  @Roles('verification_staff', 'super_admin')
  @Get('roles')
  listRoles() {
    return Object.values(ROLE_ACCESS_DESCRIPTIONS);
  }
}
