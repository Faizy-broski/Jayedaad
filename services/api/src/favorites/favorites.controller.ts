import { Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ScopeGuard } from '../common/guards/scope.guard';
import { FavoritesRepository } from './favorites.repository';

// Every route requires authentication (no @Public) — a favorites list is
// inherently per-user. No @Roles() needed: any authenticated buyer/owner/
// agent can favorite a listing, scoping happens via req.user.id, never a
// client-supplied user id.
@UseGuards(ScopeGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesRepository) {}

  @Get()
  list(@Req() req: any) {
    return this.favorites.list(req.user.id);
  }

  @Post(':listingId')
  add(@Req() req: any, @Param('listingId') listingId: string) {
    return this.favorites.add(req.user.id, listingId);
  }

  @Delete(':listingId')
  remove(@Req() req: any, @Param('listingId') listingId: string) {
    return this.favorites.remove(req.user.id, listingId);
  }
}
