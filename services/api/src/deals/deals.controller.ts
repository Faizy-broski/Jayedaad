import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ScopeGuard } from '../common/guards/scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DealsRepository } from './deals.repository';

// Read side of the deals ledger — same scope=own|agency pagination
// convention as GET /crm/leads (LeadsController.list). The writes
// (mark-sold/mark-rented) deliberately stay on ListingsController: they're
// listing status transitions in the same family as renew()/boost(), not
// deal reads, even though they write a deals row under the hood via
// DealsRepository.markSold/markRented.
@Controller('deals')
export class DealsController {
  constructor(private readonly deals: DealsRepository) {}

  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Get()
  list(
    @Req() req: any,
    @Query('scope') scope?: 'own' | 'agency',
    @Query('dealType') dealType?: 'sale' | 'rent',
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.deals.list(req.user, {
      scope,
      dealType,
      dateFrom,
      dateTo,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }
}
