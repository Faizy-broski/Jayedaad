import { Module } from '@nestjs/common';
import { DealsController } from './deals.controller';
import { DealsRepository } from './deals.repository';

@Module({
  controllers: [DealsController],
  providers: [DealsRepository],
  // ListingsModule imports this for the mark-sold/mark-rented write path;
  // AgentsModule imports this for GET /agents/:id/revenue — same
  // shared-repository export shape as LeadsModule's exports: [LeadsRepository].
  exports: [DealsRepository],
})
export class DealsModule {}
