import {
  Body,
  Controller,
  Delete,
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
import { AgenciesRepository } from './agencies.repository';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { SetAgencyVerificationStatusDto } from './dto/set-verification-status.dto';
import { UploadOnboardingDocumentDto } from './dto/upload-document.dto';
import { CreateAgencyStaffDto } from './dto/create-agency-staff.dto';
import { SetAgencyStaffAdminDto } from './dto/set-agency-staff-admin.dto';
import { RegisterAgencyDto } from './dto/register-agency.dto';
import { SetAgencyTierDto } from './dto/set-agency-tier.dto';
import type { AgencyTier } from './agencies.repository';

@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agencies: AgenciesRepository) {}

  @Public()
  @Get()
  list(@Query('city') city?: string) {
    return this.agencies.list({ city });
  }

  // Public Agents directory (apps/web /agents) — Titanium/Featured tier
  // strips plus the searchable, paginated grid (Property Type, City,
  // Company name). Declared before :slug below so 'search'/'cities' aren't
  // swallowed as a slug value, same discipline as ProjectsController.
  @Public()
  @Get('search')
  searchPublic(
    @Query('city') city?: string,
    @Query('location') location?: string,
    @Query('tier') tier?: AgencyTier,
    @Query('propertyTypeSlug') propertyTypeSlug?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.agencies.searchPublic({
      city,
      location,
      tier,
      propertyTypeSlug,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  // Backs "Browse Agencies By City".
  @Public()
  @Get('cities')
  listCities() {
    return this.agencies.listCitiesWithCounts();
  }

  // Super Admin-curated Titanium/Featured placement — separate from the
  // agency-admin-writable update() below on purpose (see
  // AgenciesRepository.setTier).
  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch(':id/tier')
  setTier(@Param('id') id: string, @Body() body: SetAgencyTierDto) {
    return this.agencies.setTier(id, body.tier);
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.agencies.findBySlug(slug);
  }

  // Property inventory by type/purpose — confirmed real on a scraped Zameen
  // agency page, computed at query time (see agencies.repository.ts::getStats).
  @Public()
  @Get(':slug/stats')
  async getStats(@Param('slug') slug: string) {
    const agency = await this.agencies.findBySlug(slug);
    return this.agencies.getStats((agency as any).id);
  }

  // Direct Super Admin creation — matches [Spec §7] "Agents are onboarded
  // through a verification process". See POST /agencies/register below for
  // the self-service counterpart (signup's "Agency" account type).
  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Post()
  create(@Body() body: CreateAgencyDto) {
    return this.agencies.create(body);
  }

  // Self-service agency registration (signup's "Agency" account type) — a
  // buyer registers a brand-new agency and becomes its admin in one step,
  // both starting 'pending'. Buyer-only, same discipline as
  // POST /agents/apply (agents.controller.ts) — an existing agent/owner/etc.
  // re-registering would create a second, orphaned agent_profiles row.
  @UseGuards(ScopeGuard)
  @Roles('buyer')
  @Post('register')
  register(@Req() req: any, @Body() body: RegisterAgencyDto) {
    return this.agencies.registerSelfService(req.user.id, body);
  }

  // The write-mechanism explicitly deferred at create-time — every agency
  // starts 'pending' and previously had no way to ever move out of it.
  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch(':id/verify')
  setVerificationStatus(@Param('id') id: string, @Body() body: SetAgencyVerificationStatusDto) {
    return this.agencies.setVerificationStatus(id, body.status, body.reason);
  }

  // Self-service for the agency's own admin, in addition to Super Admin —
  // previously this was super_admin-only, so an agency's own details
  // (name/city/phone/logo/description) were effectively write-once, set at
  // registerSelfService() during signup with no way to ever edit them
  // again. assertCanManageAgency mirrors assertCanManageStaff's admin-flag
  // check — regular staff can't edit the agency's own record, only its admin.
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: UpdateAgencyDto) {
    await this.assertCanManageAgency(req, id);
    return this.agencies.update(id, body);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agencies.remove(id);
  }

  // Real onboarding requirement — company registration, owner's ID card, tax
  // certificate. Not @Roles('super_admin')-only: the agency's own admin
  // (fresh off self-service registration) must be able to upload these
  // during the 'pending' review window. assertSameAgency enforces the
  // boundary, mirroring the staff routes below.
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UploadOnboardingDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.assertSameAgency(req, id);
    return this.agencies.addDocument(id, body.documentType, file);
  }

  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Get(':id/documents')
  async listDocuments(@Req() req: any, @Param('id') id: string) {
    await this.assertSameAgency(req, id);
    return this.agencies.listDocuments(id);
  }

  // --- Agency self-management ("Agency Staff") ----------------------------
  // Not @Roles('super_admin') — any agent may reach these routes, but
  // assertSameAgency/assertCanManageStaff below enforce the real boundary
  // (their own agency, and admin-flag for writes). Mirrors the
  // assertOwnAgentOrAdmin pattern in agents.controller.ts.

  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Get(':id/staff')
  async listStaff(@Req() req: any, @Param('id') id: string) {
    await this.assertSameAgency(req, id);
    return this.agencies.listStaff(id);
  }

  // Admin-only rollup — "full control and visibility to their overall
  // performance, analytics, and their sales associates" (Document
  // Verification Phase 3). Reuses assertCanManageStaff's admin-flag check.
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Get(':id/analytics')
  async getStaffAnalytics(@Req() req: any, @Param('id') id: string) {
    await this.assertCanManageStaff(req, id);
    return this.agencies.getStaffAnalytics(id);
  }

  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Post(':id/staff')
  async addStaff(@Req() req: any, @Param('id') id: string, @Body() body: CreateAgencyStaffDto) {
    await this.assertCanManageStaff(req, id);
    return this.agencies.addStaff(id, body);
  }

  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Patch(':id/staff/:agentId/admin')
  async setStaffAdmin(
    @Req() req: any,
    @Param('id') id: string,
    @Param('agentId') agentId: string,
    @Body() body: SetAgencyStaffAdminDto,
  ) {
    await this.assertCanManageStaff(req, id);
    return this.agencies.setStaffAdmin(id, agentId, body.isAgencyAdmin);
  }

  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Delete(':id/staff/:agentId')
  async removeStaff(@Req() req: any, @Param('id') id: string, @Param('agentId') agentId: string) {
    await this.assertCanManageStaff(req, id);
    return this.agencies.removeStaff(id, agentId);
  }

  private async assertSameAgency(req: any, agencyId: string) {
    if (req.user.role === 'super_admin') return;
    if (req.user.role !== 'agent' || !req.user.agentId) {
      throw new ForbiddenException('Only an agent or super_admin can view agency staff');
    }
    const scope = await this.agencies.getStaffScope(req.user.agentId);
    if (scope.agencyId !== agencyId) {
      throw new ForbiddenException("Cannot view another agency's staff");
    }
  }

  private async assertCanManageAgency(req: any, agencyId: string) {
    if (req.user.role === 'super_admin') return;
    if (req.user.role !== 'agent' || !req.user.agentId) {
      throw new ForbiddenException('Only an agency admin or super_admin can edit agency details');
    }
    const scope = await this.agencies.getStaffScope(req.user.agentId);
    if (!scope.isAgencyAdmin || scope.agencyId !== agencyId) {
      throw new ForbiddenException("Only this agency's admin or super_admin can edit its details");
    }
  }

  private async assertCanManageStaff(req: any, agencyId: string) {
    if (req.user.role === 'super_admin') return;
    if (req.user.role !== 'agent' || !req.user.agentId) {
      throw new ForbiddenException('Only an agency admin or super_admin can manage agency staff');
    }
    const scope = await this.agencies.getStaffScope(req.user.agentId);
    if (!scope.isAgencyAdmin || scope.agencyId !== agencyId) {
      throw new ForbiddenException("Only this agency's admin or super_admin can manage its staff");
    }
  }
}
