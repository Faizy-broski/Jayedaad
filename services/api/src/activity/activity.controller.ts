import { BadRequestException, Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ScopeGuard } from '../common/guards/scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ActivityRepository } from './activity.repository';
import { LogActivityDto } from './dto/log-activity.dto';

@UseGuards(ScopeGuard)
@Roles('agent', 'super_admin')
@Controller('crm/activity')
export class ActivityController {
  constructor(private readonly activity: ActivityRepository) {}

  @Post()
  log(@Req() req: any, @Body() body: LogActivityDto) {
    return this.activity.log(req.user, body);
  }

  // Exactly one of leadId/opportunityId — a lead's own timeline and an
  // opportunity's own timeline are fetched separately even for an activity
  // logged against both (each still appears in both queries, since
  // log_activity's RPC writes a pointer row into both parent tables when
  // both ids are given).
  @Get()
  list(@Req() req: any, @Query('leadId') leadId?: string, @Query('opportunityId') opportunityId?: string) {
    if (!!leadId === !!opportunityId) {
      throw new BadRequestException('Provide exactly one of leadId or opportunityId.');
    }
    return leadId ? this.activity.listForLead(req.user, leadId) : this.activity.listForOpportunity(req.user, opportunityId!);
  }
}
