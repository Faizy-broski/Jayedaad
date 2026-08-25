import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ScopeGuard } from '../common/guards/scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { LeadsRepository } from './leads.repository';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { AddLeadNoteDto } from './dto/add-lead-note.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { OpportunitiesRepository } from '../opportunities/opportunities.repository';

// Guards are applied per-method (not at the class level) because `create`
// must be reachable by an unauthenticated buyer submitting a contact-form
// inquiry — every other route stays agent/super_admin-only, and
// verification_staff never sees this module at all [Dev Instr §2.2].
@Controller('crm/leads')
export class LeadsController {
  constructor(
    private readonly leads: LeadsRepository,
    private readonly opportunities: OpportunitiesRepository,
  ) {}

  // Public intake: chatbot leads, contact-agent form submissions, call
  // requests [Dev Instr §3.1]. No role required — the requester has no
  // account. Tightened below the global ThrottlerModule default
  // (app.module.ts, 100/min, IP-based and shared across every route) —
  // this is the one public, unauthenticated, spam-prone write endpoint in
  // the whole API, same override discipline as auth/otp/otp.controller.ts.
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
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
    @Query('scope') scope?: 'own' | 'agency',
    @Query('unassigned') unassigned?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.leads.list(req.user, {
      status,
      listingId,
      agentId,
      scope,
      unassigned: unassigned === 'true',
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  // Single-lead fetch — backs LeadDetailScreen.tsx (mobile).
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Get(':id')
  findById(@Req() req: any, @Param('id') id: string) {
    return this.leads.findById(req.user, id);
  }

  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Post(':id/notes')
  addNote(@Req() req: any, @Param('id') id: string, @Body() body: AddLeadNoteDto) {
    return this.leads.addNote(req.user, id, body.body);
  }

  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Patch(':id/status')
  updateStatus(@Req() req: any, @Param('id') id: string, @Body() body: UpdateLeadStatusDto) {
    return this.leads.updateStatus(req.user, id, body.status);
  }

  // "Convert to Opportunity" — promotes this lead into a real pre-close
  // pipeline object (services/api/src/opportunities/). Agent- or
  // super_admin-eligible (mirrors updateStatus above): a super_admin can
  // convert on behalf of the lead's own agent, same as they can update its
  // status on that agent's behalf. Eligibility (status, no existing active
  // opportunity) is enforced in OpportunitiesRepository.convertFromLead.
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Post(':id/convert')
  convert(@Req() req: any, @Param('id') id: string, @Body() body: ConvertLeadDto) {
    return this.opportunities.convertFromLead(req.user, id, body);
  }

  // J.Team-only per [Dev Instr §3.2]: "Agents cannot reassign leads to other
  // agents without J.Team involvement."
  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch(':id/assign')
  assign(@Req() req: any, @Param('id') id: string, @Body('agentId') agentId: string) {
    return this.leads.assign(req.user.id, id, agentId);
  }

  // super_admin-only — agents don't get delete, only status transitions to
  // closed/lost (mirrors the reassign-is-admin-only asymmetry above).
  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leads.remove(id);
  }
}
