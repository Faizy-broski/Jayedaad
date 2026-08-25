import { Module } from '@nestjs/common';
import { ActivityController } from './activity.controller';
import { ActivityRepository } from './activity.repository';
import { LeadsModule } from '../leads/leads.module';
import { OpportunitiesModule } from '../opportunities/opportunities.module';

@Module({
  // LeadsModule/OpportunitiesModule: reuses assertCanAccessLead /
  // assertCanAccessOpportunity instead of duplicating the own/agency-scope
  // ownership rule a third time.
  imports: [LeadsModule, OpportunitiesModule],
  controllers: [ActivityController],
  providers: [ActivityRepository],
})
export class ActivityModule {}
