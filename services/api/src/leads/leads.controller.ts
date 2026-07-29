import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ScopeGuard } from '../common/guards/scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { LeadsRepository } from './leads.repository';
import { CreateLeadDto } from './dto/create-lead.dto';

// Guards are applied per-method (not at the class level) because `create`
// must be reachable by an unauthenticated buyer submitting a contact-form
// inquiry — every other route stays agent/super_admin-only, and
// verification_staff never sees this module at all [Dev Instr §2.2].
@Controller('crm/leads')
export class LeadsController {
  constructor(private readonly leads: LeadsRepository) {}

  // Public intake: chatbot leads, contact-agent form submissions, call
  // requests [Dev Instr §3.1]. No role required — the requester has no account.
  @Public()
  @Post()
  create(@Body() body: CreateLeadDto) {
    return this.leads.create(body);
  }

  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Get()
  list(
    @Req() req: any,
    @Query('status') status?: any,
    @Query('listingId') listingId?: string,
    // Super Admin-only in practice — the repository ignores this filter for
    // scoped roles (agent), same discipline as every other scope check.
    @Query('agentId') agentId?: string,
  ) {
    return this.leads.list(req.user, { status, listingId, agentId });
  }

  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Post(':id/notes')
  addNote(@Req() req: any, @Param('id') id: string, @Body('body') body: string) {
    return this.leads.addNote(req.user, id, body);
  }

  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Patch(':id/status')
  updateStatus(@Req() req: any, @Param('id') id: string, @Body('status') status: any) {
    return this.leads.updateStatus(req.user, id, status);
  }

  // J.Team-only per [Dev Instr §3.2]: "Agents cannot reassign leads to other
  // agents without J.Team involvement."
  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch(':id/assign')
  assign(@Req() req: any, @Param('id') id: string, @Body('agentId') agentId: string) {
    return this.leads.assign(req.user.id, id, agentId);
  }
}
