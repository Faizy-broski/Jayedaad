import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ScopeGuard } from '../common/guards/scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRepository } from './admin.repository';
import { ROLE_ACCESS_DESCRIPTIONS } from './role-access-descriptions';

// Super Admin-only platform rollup — everything else this session is scoped
// to a single agent/agency; nothing until now gives a whole-platform view.
@UseGuards(ScopeGuard)
@Roles('super_admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminRepository) {}

  @Get('stats')
  getStats() {
    return this.admin.getPlatformStats();
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

  // "Which role gets what dashboard access" reference for the team
  // management screen — see role-access-descriptions.ts.
  @Get('roles')
  listRoles() {
    return Object.values(ROLE_ACCESS_DESCRIPTIONS);
  }
}
