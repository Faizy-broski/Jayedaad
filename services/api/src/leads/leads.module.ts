import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsRepository } from './leads.repository';

@Module({
  controllers: [LeadsController],
  providers: [LeadsRepository],
})
export class LeadsModule {}
