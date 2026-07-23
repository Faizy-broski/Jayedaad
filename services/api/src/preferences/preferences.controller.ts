import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ScopeGuard } from '../common/guards/scope.guard';
import { PreferencesRepository } from './preferences.repository';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

// Self-scoped to req.user.id, no @Roles() restriction — any authenticated
// user (buyer/owner/agent/staff/admin) has their own preferences.
@UseGuards(ScopeGuard)
@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferences: PreferencesRepository) {}

  @Get()
  get(@Req() req: any) {
    return this.preferences.get(req.user.id);
  }

  @Patch()
  update(@Req() req: any, @Body() body: UpdatePreferencesDto) {
    return this.preferences.update(req.user.id, body);
  }
}
