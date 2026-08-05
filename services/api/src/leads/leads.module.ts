import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsRepository } from './leads.repository';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [AppointmentsModule],
  controllers: [LeadsController],
  providers: [LeadsRepository],
})
export class LeadsModule {}
