import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsRepository } from './appointments.repository';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsRepository],
  exports: [AppointmentsRepository],
})
export class AppointmentsModule {}
