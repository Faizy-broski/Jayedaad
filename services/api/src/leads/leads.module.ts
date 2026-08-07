import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsRepository } from './leads.repository';
import { AppointmentsModule } from '../appointments/appointments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AppointmentsModule, NotificationsModule],
  controllers: [LeadsController],
  providers: [LeadsRepository],
  // RemindersModule/TasksModule reuse LeadsRepository's ownership check
  // (assertCanAccessLead) and agent-notify helper (notifyAgent) instead of
  // duplicating them.
  exports: [LeadsRepository],
})
export class LeadsModule {}
