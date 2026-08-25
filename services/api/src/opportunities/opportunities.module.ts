import { Module } from '@nestjs/common';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesRepository } from './opportunities.repository';
import { DealsModule } from '../deals/deals.module';

@Module({
  imports: [DealsModule],
  controllers: [OpportunitiesController],
  providers: [OpportunitiesRepository],
  // Phase 2's ActivityModule reuses assertCanAccessOpportunity instead of
  // duplicating it — same convention as LeadsModule exporting LeadsRepository.
  exports: [OpportunitiesRepository],
})
export class OpportunitiesModule {}
