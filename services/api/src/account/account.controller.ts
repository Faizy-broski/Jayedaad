import { Body, Controller, Delete, Patch, Req, UseGuards } from '@nestjs/common';
import { ScopeGuard } from '../common/guards/scope.guard';
import { AccountRepository } from './account.repository';
import { UpdateOwnProfileDto } from './dto/update-profile.dto';

// Self-scoped to req.user.id, no @Roles() restriction — the profile-update
// and account-deletion path every role (buyer/owner/agent/staff/admin) can
// exercise on their own account. Mirrors preferences.controller.ts's pattern.
@UseGuards(ScopeGuard)
@Controller('account')
export class AccountController {
  constructor(private readonly account: AccountRepository) {}

  @Patch('profile')
  updateProfile(@Req() req: any, @Body() body: UpdateOwnProfileDto) {
    return this.account.updateProfile(req.user.id, body);
  }

  @Delete()
  deleteAccount(@Req() req: any) {
    return this.account.deleteAccount(req.user.id);
  }
}
