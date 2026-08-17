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
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';
import { ProjectsRepository } from './projects.repository';
import { ProjectMediaService } from './project-media.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { SetProjectVerificationStatusDto } from './dto/set-verification-status.dto';
import { TrackEngagementDto } from './dto/track-engagement.dto';
import { BoostProjectDto } from './dto/boost-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projects: ProjectsRepository,
    private readonly projectMedia: ProjectMediaService,
  ) {}

  // Public, unauthenticated — confirmed real on the Zameen New Projects
  // search page: City, Property Type (via the category taxonomy), Budget
  // Range, Area Range, Project Title (keyword) and Developer filters, plus
  // sort/pagination. Mirrors ListingsController.findPublic.
  @Public()
  @Get()
  findPublic(
    @Query('city') city?: string,
    @Query('area') area?: string,
    @Query('status') status?: 'planned' | 'under_construction' | 'ready',
    @Query('propertyTypeSlug') propertyTypeSlug?: string,
    @Query('developerSlug') developerSlug?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minAreaValue') minAreaValue?: string,
    @Query('maxAreaValue') maxAreaValue?: string,
    @Query('areaUnit') areaUnit?: 'marla' | 'kanal' | 'sqyd' | 'sqft' | 'sqm' | 'acre',
    @Query('keyword') keyword?: string,
    @Query('sortBy') sortBy?: 'newest' | 'price_asc' | 'price_desc',
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.projects.findPublic({
      city,
      area,
      status,
      propertyTypeSlug,
      developerSlug,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minAreaValue: minAreaValue ? Number(minAreaValue) : undefined,
      maxAreaValue: maxAreaValue ? Number(maxAreaValue) : undefined,
      areaUnit,
      keyword,
      sortBy,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  // Agent/Super Admin "manage" list — every project regardless of
  // verification_status (pending/verified/rejected), unlike the public
  // findPublic above which only ever shows 'verified'. Backs both
  // /admin/projects and the agent-portal /projects list, which both share
  // apps/web/components/projects/ProjectsListView.tsx. Declared before the
  // :slug route below so 'manage' isn't swallowed as a slug value.
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Get('manage')
  findAll(
    @Query('city') city?: string,
    @Query('area') area?: string,
    @Query('status') status?: 'planned' | 'under_construction' | 'ready' | 'draft',
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.projects.findPublic(
      { city, area, status, keyword, page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined },
      true,
    );
  }

  // Backs "Browse Projects by City" (Islamabad 285, Lahore 219, ...).
  @Public()
  @Get('cities')
  listCities() {
    return this.projects.listCitiesWithCounts();
  }

  // Backs "Browse Projects by Category" (Flats 486, Plots 427, ...).
  @Public()
  @Get('categories')
  listCategories() {
    return this.projects.listCategoriesWithCounts();
  }

  // Agent/Super Admin detail fetch by id — backs the /admin/projects/[id]
  // (edit, super_admin) and /projects/[id] (read-only view, agent) pages.
  // Declared before :slug below so 'id' isn't swallowed as a slug value.
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Get('id/:id')
  findById(@Param('id') id: string) {
    return this.projects.findById(id);
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.projects.findBySlug(slug);
  }

  // Developer/project onboarding — Super Admin or agent (matches the same
  // roles allowed to submit listings) [Spec §7].
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Post()
  create(@Req() req: any, @Body() body: CreateProjectDto) {
    return this.projects.create(body, req.user.role, req.user.id, req.user.agentId);
  }

  // Approve/reject — the publish gate agent-authored projects need before
  // findPublic() will ever surface them. Super Admin-only, same shape as
  // AgenciesController's verification action.
  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch(':id/verification')
  setVerificationStatus(@Param('id') id: string, @Body() body: SetProjectVerificationStatusDto) {
    return this.projects.setVerificationStatus(id, body.status);
  }

  // Full-page-form edit — self-scoped to the agent's own project (or
  // super_admin, any), same shape as ListingsController.update. Editing a
  // rejected project resets it to 'pending' for re-review (see
  // ProjectsRepository.update); a verified project keeps its status
  // through edits instead.
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: UpdateProjectDto) {
    await this.assertOwnProject(req, id);
    return this.projects.update(id, body);
  }

  // Self-scoped like update() above — an agent may delete their own project
  // at any verification status, same freedom ListingsController.remove()
  // already gives listings (no equivalent "once verified" restriction
  // there). Previously an agent couldn't delete their own project once it
  // was verified/live at all, only a Super Admin could; that asymmetry
  // with listings was the actual bug, not a deliberate safeguard worth
  // keeping.
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.assertCanDeleteProject(req, id);
    return this.projects.remove(id);
  }

  // Spends one of the agent's plan-granted Hot/Super Hot credits (the SAME
  // shared agent_credits pool ListingsController.boost spends from — an
  // agent's per-period allotment can be spent on either a listing or a
  // project) to feature this project. Agent-only, not super_admin — a
  // super_admin-authored project has no agent_credits row to spend from,
  // same reasoning as ListingsController.boost.
  @UseGuards(ScopeGuard)
  @Roles('agent')
  @Post(':id/boost')
  async boost(@Req() req: any, @Param('id') id: string, @Body() body: BoostProjectDto) {
    await this.assertOwnProject(req, id);
    return this.projects.boost(id, req.user.agentId, body);
  }

  // Spends one Refresh credit to bump this project's sort position without
  // changing its boost tier — mirrors ListingsController.refreshListing.
  @UseGuards(ScopeGuard)
  @Roles('agent')
  @Post(':id/refresh')
  async refreshProject(@Req() req: any, @Param('id') id: string) {
    await this.assertOwnProject(req, id);
    return this.projects.refresh(id, req.user.agentId);
  }

  // Spends one Story credit to feature this project for a fixed 24h window
  // — mirrors ListingsController.postStory.
  @UseGuards(ScopeGuard)
  @Roles('agent')
  @Post(':id/story')
  async postStory(@Req() req: any, @Param('id') id: string) {
    await this.assertOwnProject(req, id);
    return this.projects.postStory(id, req.user.agentId);
  }

  // Mirrors ListingsController.assertOwnListing — super_admin bypasses,
  // an agent may only modify a project they created.
  private async assertOwnProject(req: any, id: string) {
    if (req.user.role === 'super_admin') return;
    const { createdBy } = await this.projects.getOwnership(id);
    if (createdBy !== req.user.id) {
      throw new ForbiddenException('Cannot modify a project you did not create');
    }
  }

  private async assertCanDeleteProject(req: any, id: string) {
    if (req.user.role === 'super_admin') return;
    const { createdBy } = await this.projects.getOwnership(id);
    if (createdBy !== req.user.id) {
      throw new ForbiddenException('Cannot delete a project you did not create');
    }
  }

  // Gallery/floor plan/brochure uploads as they're picked on the create
  // form — same upload-on-select pattern as ListingsController.uploadMedia.
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Post('media/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadMedia(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.projectMedia.upload(req.user.id, file);
  }

  // Mirrors ListingsController.trackEngagement — public, throttled below the
  // global default since it's an unauthenticated write anyone can call.
  // Declared after the literal 'media/upload' route so that POST request
  // isn't captured by this param route.
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post(':id/track')
  trackEngagement(@Param('id') id: string, @Body() body: TrackEngagementDto) {
    return this.projects.trackEngagement(id, body);
  }
}
