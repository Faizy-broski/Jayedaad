import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';
import { SubscriptionTiersRepository } from './subscription-tiers.repository';
import { CreateSubscriptionTierDto, UpdateSubscriptionTierDto } from './dto/subscription-tier.dto';

@Controller('subscription-tiers')
export class SubscriptionTiersController {
  constructor(private readonly tiers: SubscriptionTiersRepository) {}

  // Public — agents need to see available plans before upgrading.
  @Public()
  @Get()
  list(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.tiers.list({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Post()
  create(@Body() body: CreateSubscriptionTierDto) {
    return this.tiers.create(body);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateSubscriptionTierDto) {
    return this.tiers.update(id, body);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tiers.remove(id);
  }
}
