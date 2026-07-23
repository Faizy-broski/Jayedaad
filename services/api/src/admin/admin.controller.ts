import { Controller, Get, UseGuards } from '@nestjs/common';
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
  listAgents() {
    return this.admin.listAgentsOverview();
  }

  // "Which role gets what dashboard access" reference for the team
  // management screen — see role-access-descriptions.ts.
  @Get('roles')
  listRoles() {
    return Object.values(ROLE_ACCESS_DESCRIPTIONS);
  }
}
