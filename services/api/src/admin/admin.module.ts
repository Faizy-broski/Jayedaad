import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminRepository } from './admin.repository';
import { RevenueRepository } from './revenue.repository';
import { DealsModule } from '../deals/deals.module';

@Module({
  // DealsModule: AdminController's new GET /admin/agencies/:id/revenue
  // reuses DealsRepository.getAgencyRevenue rather than forking the
  // commission-aggregation logic.
  imports: [DealsModule],
  controllers: [AdminController],
  providers: [AdminRepository, RevenueRepository],
})
export class AdminModule {}
