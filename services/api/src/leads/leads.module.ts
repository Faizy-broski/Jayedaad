import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsRepository } from './leads.repository';
import { AppointmentsModule } from '../appointments/appointments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OpportunitiesModule } from '../opportunities/opportunities.module';

@Module({
  // OpportunitiesModule: LeadsController's "Convert to Opportunity" action
  // (POST /crm/leads/:id/convert) delegates straight to
  // OpportunitiesRepository.convertFromLead — no new logic duplicated here.
  imports: [AppointmentsModule, NotificationsModule, OpportunitiesModule],
  controllers: [LeadsController],
  providers: [LeadsRepository],
  // RemindersModule/TasksModule reuse LeadsRepository's ownership check
  // (assertCanAccessLead) and agent-notify helper (notifyAgent) instead of
  // duplicating them.
  exports: [LeadsRepository],
})
export class LeadsModule {}
