import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ScopeGuard } from '../common/guards/scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { OpportunitiesRepository, OpportunityStage } from './opportunities.repository';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityStageDto } from './dto/update-opportunity-stage.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';

@UseGuards(ScopeGuard)
@Controller('crm/opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunities: OpportunitiesRepository) {}

  @Roles('agent', 'super_admin')
  @Get()
  list(
    @Req() req: any,
    @Query('stage') stage?: OpportunityStage,
    @Query('agentId') agentId?: string,
    @Query('scope') scope?: 'own' | 'agency',
    @Query('listingId') listingId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.opportunities.list(req.user, {
      stage,
      agentId,
      scope,
      listingId,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  // Registered before the bare ':id' route below — 'funnel' as a static
  // segment would otherwise be swallowed by :id's single-segment match.
  @Roles('agent', 'super_admin')
  @Get('funnel')
  getFunnel(
    @Req() req: any,
    @Query('scope') scope?: 'own' | 'agency',
    @Query('agentId') agentId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.opportunities.getFunnel(req.user, { scope, agentId, dateFrom, dateTo });
  }

  @Roles('agent', 'super_admin')
  @Get(':id')
  findById(@Req() req: any, @Param('id') id: string) {
    return this.opportunities.findById(req.user, id);
  }

  // Direct-creation path — agent-only, always under their own agent_id.
  // Converting from a lead (super_admin-eligible, on-behalf-of the lead's
  // own agent) is a separate route on LeadsController.
  @Roles('agent')
  @Post()
  create(@Req() req: any, @Body() body: CreateOpportunityDto) {
    return this.opportunities.create(req.user, body);
  }

  @Roles('agent', 'super_admin')
  @Patch(':id/stage')
  updateStage(@Req() req: any, @Param('id') id: string, @Body() body: UpdateOpportunityStageDto) {
    return this.opportunities.updateStage(req.user, id, body);
  }

  @Roles('agent', 'super_admin')
  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: UpdateOpportunityDto) {
    return this.opportunities.update(req.user, id, body);
  }
}
