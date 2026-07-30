import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';
import { AgentsRepository } from './agents.repository';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateAgentProfileDto } from './dto/update-profile.dto';
import { GrantCreditsDto } from './dto/grant-credits.dto';
import { ApplyAsAgentDto } from './dto/apply-as-agent.dto';
import { UploadOnboardingDocumentDto } from './dto/upload-document.dto';
import { SetAgentVerificationStatusDto } from './dto/set-verification-status.dto';
import { AvatarMediaService } from './avatar-media.service';

@Controller('agents')
export class AgentsController {
  constructor(
    private readonly agents: AgentsRepository,
    private readonly avatarMedia: AvatarMediaService,
  ) {}

  // Staff review queue — the counterpart to GET /verification/queue for
  // listings. Nothing else lists pending agents (GET /admin/agents is the
  // full roster, deliberately super_admin-only); verification_staff needs
  // its own narrower view to actually process self-service applications.
  // Declared BEFORE the bare GET :id below — both are single-segment GET
  // routes, and Nest/Express try routes in declaration order, so :id would
  // otherwise swallow this literal path (same footgun documented in
  // listings.controller.ts re: 'mine' vs :id).
  @UseGuards(ScopeGuard)
  @Roles('super_admin', 'verification_staff')
  @Get('pending-verification')
  listPendingVerification() {
    return this.agents.listPendingVerification();
  }

  @Public()
  @Get(':id')
  findProfile(@Param('id') id: string) {
    return this.agents.findProfile(id);
  }

  // Self-service "Apply to become an agent" — buyer-only (an existing
  // agent/owner/etc. re-applying would create a second, orphaned
  // agent_profiles row, so this is deliberately gated to the one role that
  // has no agent_profiles row yet). Lands in the same `pending` review queue
  // as a super_admin-created agent.
  @UseGuards(ScopeGuard)
  @Roles('buyer')
  @Post('apply')
  applyAsAgent(@Req() req: any, @Body() body: ApplyAsAgentDto) {
    return this.agents.applyAsAgent(req.user.id, body);
  }

  @Public()
  @Get(':id/reviews')
  listReviews(@Param('id') id: string) {
    return this.agents.listReviews(id);
  }

  // Property inventory by type/purpose — mirrors GET /agencies/:slug/stats,
  // confirmed against a real Zameen agency page's exact stat shape.
  // Public — the same summary counts are shown on a public agency/agent page.
  @Public()
  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.agents.getStats(id);
  }

  // Analytics and credit balances are private business data (confirmed only
  // visible on the agent's OWN logged-in Profolio dashboard, never on a
  // public profile) — ScopeGuard only checks role membership, so ownership
  // is enforced explicitly here: an agent may only see their own.
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Get(':id/analytics')
  getAnalytics(
    @Req() req: any,
    @Param('id') id: string,
    @Query('purpose') purpose?: 'sale' | 'rent',
    @Query('since') since?: string,
  ) {
    this.assertOwnAgentOrAdmin(req, id);
    return this.agents.getAnalytics(id, { purpose, since: since ? new Date(since) : undefined });
  }

  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Get(':id/credits')
  getCredits(@Req() req: any, @Param('id') id: string) {
    this.assertOwnAgentOrAdmin(req, id);
    return this.agents.getCredits(id);
  }

  // Super Admin grant/adjust — deliberately super_admin-only (not agent, who
  // could otherwise grant themselves unlimited credits). The write-side
  // counterpart to GET :id/credits, explicitly deferred pending this module
  // in the Analytics pass.
  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch(':id/credits')
  grantCredits(@Param('id') id: string, @Body() body: GrantCreditsDto) {
    return this.agents.grantCredits(id, body);
  }

  // The Profolio "User Settings" page's save action — same ownership
  // discipline as analytics/credits above.
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Patch(':id')
  updateProfile(@Req() req: any, @Param('id') id: string, @Body() body: UpdateAgentProfileDto) {
    this.assertOwnAgentOrAdmin(req, id);
    return this.agents.updateProfile(id, body);
  }

  // Profile picture — own dedicated "avatars" bucket (see
  // avatar-media.service.ts), separate from listing-media. Same ownership
  // discipline as updateProfile above.
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(@Req() req: any, @Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    this.assertOwnAgentOrAdmin(req, id);
    const url = await this.avatarMedia.upload(id, file);
    return this.agents.updatePhoto(id, url);
  }

  private assertOwnAgentOrAdmin(req: any, agentId: string) {
    if (req.user.role === 'super_admin') return;
    if (req.user.agentId !== agentId) {
      throw new ForbiddenException("Cannot access another agent's private data");
    }
  }

  // Any authenticated user can review an agent — no @Roles() restriction,
  // just @UseGuards(ScopeGuard) to require a real logged-in reviewer
  // (reviewer_id comes from the token, never the request body).
  @UseGuards(ScopeGuard)
  @Post(':id/reviews')
  createReview(@Req() req: any, @Param('id') id: string, @Body() body: CreateReviewDto) {
    return this.agents.createReview(req.user.id, id, body);
  }

  // Real onboarding requirement — company registration, owner's ID card, tax
  // certificate (same set as agencies; an independent agent stands in as
  // their own "company"). Only the agent themselves or super_admin may upload.
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UploadOnboardingDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.assertOwnAgentOrAdmin(req, id);
    return this.agents.addDocument(id, body.documentType, file);
  }

  // verification_staff can review an agent's documents ahead of an
  // onboarding decision, same as they review listing documents.
  @UseGuards(ScopeGuard)
  @Roles('agent', 'verification_staff', 'super_admin')
  @Get(':id/documents')
  listDocuments(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'verification_staff') this.assertOwnAgentOrAdmin(req, id);
    return this.agents.listDocuments(id);
  }

  // verification_staff can now approve/reject agents, same split as listing
  // verification (verification_staff + super_admin both act there) — was
  // super_admin-only despite verification_staff already being able to
  // review an agent's documents via GET :id/documents above.
  @UseGuards(ScopeGuard)
  @Roles('super_admin', 'verification_staff')
  @Patch(':id/verify')
  setVerificationStatus(@Param('id') id: string, @Body() body: SetAgentVerificationStatusDto) {
    return this.agents.setVerificationStatus(id, body.status);
  }
}
