import { Body, Controller, Delete, Get, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ScopeGuard } from '../common/guards/scope.guard';
import { AccountRepository } from './account.repository';
import { AvatarMediaService } from '../agents/avatar-media.service';
import { UpdateOwnProfileDto } from './dto/update-profile.dto';

// Self-scoped to req.user.id, no @Roles() restriction — the profile-update
// and account-deletion path every role (buyer/owner/agent/staff/admin) can
// exercise on their own account. Mirrors preferences.controller.ts's pattern.
@UseGuards(ScopeGuard)
@Controller('account')
export class AccountController {
  constructor(
    private readonly account: AccountRepository,
    private readonly avatarMedia: AvatarMediaService,
  ) {}

  // Previously missing entirely — ProfileSettingsScreen's non-agent form
  // had a PATCH but no way to ever read the profile back, so fields like
  // phone (already saved correctly at signup) never appeared on screen.
  @Get('profile')
  getProfile(@Req() req: any) {
    return this.account.getProfile(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Req() req: any, @Body() body: UpdateOwnProfileDto) {
    return this.account.updateProfile(req.user.id, body);
  }

  // Own dedicated "avatars" bucket (see agents/avatar-media.service.ts,
  // reused as-is here) — same pattern as AgentsController.uploadPhoto, just
  // self-scoped to the plain profiles table instead of agent_profiles.
  @Post('photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    const url = await this.avatarMedia.upload(`self/${req.user.id}`, file);
    return this.account.updatePhoto(req.user.id, url);
  }

  @Delete()
  deleteAccount(@Req() req: any) {
    return this.account.deleteAccount(req.user.id);
  }
}
