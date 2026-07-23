import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ScopeGuard } from '../common/guards/scope.guard';
import { SavedSearchesRepository } from './saved-searches.repository';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { UpdateSavedSearchDto } from './dto/update-saved-search.dto';

@UseGuards(ScopeGuard)
@Controller('saved-searches')
export class SavedSearchesController {
  constructor(private readonly savedSearches: SavedSearchesRepository) {}

  @Get()
  list(@Req() req: any) {
    return this.savedSearches.list(req.user.id);
  }

  @Post()
  create(@Req() req: any, @Body() body: CreateSavedSearchDto) {
    return this.savedSearches.create(req.user.id, body);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: UpdateSavedSearchDto) {
    return this.savedSearches.updateAlertFrequency(req.user.id, id, body.alertFrequency);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.savedSearches.remove(req.user.id, id);
  }
}
