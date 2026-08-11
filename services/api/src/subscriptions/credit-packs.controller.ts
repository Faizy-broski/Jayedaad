import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';
import { CreditPacksRepository } from './credit-packs.repository';
import { CreateCreditPackDto, UpdateCreditPackDto } from './dto/credit-pack.dto';

@Controller('credit-packs')
export class CreditPacksController {
  constructor(private readonly packs: CreditPacksRepository) {}

  // Public — agents need to see available top-up packs before buying, same
  // as GET /subscription-tiers. includeInactive exists for the admin table
  // (retired packs still need to be visible/editable there) — not
  // guard-gated since a retired pack's name/price isn't sensitive, same
  // trust level as subscription_tiers' own public list.
  @Public()
  @Get()
  list(@Query('includeInactive') includeInactive?: string) {
    return this.packs.list(includeInactive === 'true');
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Post()
  create(@Body() body: CreateCreditPackDto) {
    return this.packs.create(body);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateCreditPackDto) {
    return this.packs.update(id, body);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.packs.remove(id);
  }
}
