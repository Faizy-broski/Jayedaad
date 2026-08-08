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
import { ListingsRepository } from './listings.repository';
import { ListingMediaService } from './listing-media.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { TrackEngagementDto } from './dto/track-engagement.dto';
import { SetListingStatusDto } from './dto/set-status.dto';
import { UploadListingDocumentDto } from './dto/upload-document.dto';
import { BoostListingDto } from './dto/boost-listing.dto';

@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listings: ListingsRepository,
    private readonly listingMedia: ListingMediaService,
  ) {}

  // Public, unauthenticated — verified-only, identical response whether called
  // from Web, Mobile, Agent Portal, or Admin Panel [Spec §9]. Filters mirror
  // the real Zameen.com search page's facets, including price range, keyword,
  // furnishing, video, and agency — plus sort/pagination and a
  // search_queries log for platform analytics [Reqs §4.2].
  @Public()
  @Get()
  findPublic(
    @Req() req: any,
    @Query('listingId') listingId?: string,
    @Query('listingNumber') listingNumber?: string,
    @Query('city') city?: string,
    @Query('area') area?: string,
    @Query('propertyTypeSlug') propertyTypeSlug?: string,
    @Query('purpose') purpose?: 'sale' | 'rent',
    @Query('bedrooms') bedrooms?: string,
    @Query('minBathrooms') minBathrooms?: string,
    @Query('minAreaValue') minAreaValue?: string,
    @Query('maxAreaValue') maxAreaValue?: string,
    @Query('areaUnit') areaUnit?: 'marla' | 'kanal' | 'sqyd' | 'sqft' | 'sqm' | 'acre',
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('keyword') keyword?: string,
    @Query('furnishingStatus') furnishingStatus?: 'unfurnished' | 'semi_furnished' | 'furnished',
    @Query('hasVideo') hasVideo?: string,
    @Query('agencySlug') agencySlug?: string,
    @Query('sortBy') sortBy?: 'relevance' | 'newest' | 'price_asc' | 'price_desc',
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.listings.findPublic(
      {
        listingId,
        listingNumber: listingNumber ? Number(listingNumber) : undefined,
        city,
        area,
        propertyTypeSlug,
        purpose,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        minBathrooms: minBathrooms ? Number(minBathrooms) : undefined,
        minAreaValue: minAreaValue ? Number(minAreaValue) : undefined,
        maxAreaValue: maxAreaValue ? Number(maxAreaValue) : undefined,
        areaUnit,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        keyword,
        furnishingStatus,
        hasVideo: hasVideo === 'true',
        agencySlug,
        sortBy,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      },
      req.user?.id,
    );
  }

  // Powers the hierarchical City -> Area location picker on the real Zameen
  // search page — nothing populated this before this pass.
  @Public()
  @Get('locations/cities')
  listCities() {
    return this.listings.listCities();
  }

  @Public()
  @Get('locations/areas')
  listAreas(@Query('city') city: string) {
    return this.listings.listAreas(city);
  }

  // "Similar properties" section seen on real Zameen detail pages — same
  // city + property type, excluding the listing itself.
  @Public()
  @Get(':id/similar')
  findSimilar(@Param('id') id: string) {
    return this.listings.findSimilar(id);
  }

  // Backs the Views/Clicks/Calls/WhatsApp/SMS/Emails metrics confirmed real
  // on the Profolio agent dashboard's Analytics card — public, any visitor
  // triggers these, not just authenticated users. Tightened below the
  // global ThrottlerModule default (app.module.ts, 100/min) — unauthenticated
  // and otherwise abusable to inflate/pollute an agent's analytics numbers.
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post(':id/track')
  trackEngagement(@Param('id') id: string, @Body() body: TrackEngagementDto) {
    return this.listings.trackEngagement(id, body);
  }

   // Sitewide "most visited" listings, ranked by real 'view' events off
  // listing_engagement_events. Declared before the bare `:id` route below
  // for the same reason as 'mine'/'mine/status-counts' — Nest/Express match
  // routes in declaration order, and `:id` would otherwise swallow this.
  @Public()
  @Get('trending')
  findMostViewed(@Query('limit') limit?: string) {
    return this.listings.findMostViewed(limit ? Number(limit) : undefined);
  }


  // Owner/seller dashboard ("manage submissions, track verification status"
  // [Spec §8]) AND the agent Profolio "My Listings" page — role-aware:
  // owners see what they submitted, agents see what they're assigned to,
  // super_admin sees everything. Filters confirmed real on the live
  // Profolio "My Listings" filter panel.
  @UseGuards(ScopeGuard)
  @Roles('owner', 'agent', 'super_admin')
  @Get('mine')
  findMine(
    @Req() req: any,
    @Query('status')
    status?: 'draft' | 'pending_verification' | 'verified' | 'rejected' | 'expired' | 'deleted' | 'downgraded' | 'inactive',
    @Query('source') source?: 'owner_agent' | 'agency',
    @Query('propertyTypeCategory') propertyTypeCategory?: string,
    @Query('propertyTypeSlug') propertyTypeSlug?: string,
    @Query('purpose') purpose?: 'sale' | 'rent',
    @Query('listingId') listingId?: string,
    @Query('listingNumber') listingNumber?: string,
    @Query('city') city?: string,
    @Query('area') area?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minAreaValue') minAreaValue?: string,
    @Query('maxAreaValue') maxAreaValue?: string,
    @Query('areaUnit') areaUnit?: 'marla' | 'kanal' | 'sqyd' | 'sqft' | 'sqm' | 'acre',
    @Query('listedDateFrom') listedDateFrom?: string,
    @Query('listedDateTo') listedDateTo?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.listings.findMine(
      { userId: req.user.id, role: req.user.role, agentId: req.user.agentId },
      {
        status,
        source,
        propertyTypeCategory,
        propertyTypeSlug,
        purpose,
        listingId,
        listingNumber: listingNumber ? Number(listingNumber) : undefined,
        city,
        area,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minAreaValue: minAreaValue ? Number(minAreaValue) : undefined,
        maxAreaValue: maxAreaValue ? Number(maxAreaValue) : undefined,
        areaUnit,
        listedDateFrom,
        listedDateTo,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      },
    );
  }

  // Backs the status tab badges ("Active (0)", "Pending (0)", etc.) on the
  // real Profolio "My Listings" page.
  @UseGuards(ScopeGuard)
  @Roles('owner', 'agent', 'super_admin')
  @Get('mine/status-counts')
  getMyStatusCounts(@Req() req: any) {
    return this.listings.getStatusCounts({ userId: req.user.id, role: req.user.role, agentId: req.user.agentId });
  }

  // The property detail page itself — confirmed real via a scraped Zameen
  // listing detail page. Declared AFTER 'mine'/'mine/status-counts' above:
  // those are literal single/two-segment routes competing for the same
  // position as this bare :id param, and Nest/Express try routes in
  // declaration order — placed earlier, :id would swallow /listings/mine.
  @Public()
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.listings.findById(id);
  }

  // Submission entry point for the Manual Verification workflow [Spec §7].
  // owner_id/agent_id/status are all forced from the authenticated request —
  // the DTO cannot influence who owns the listing or what state it starts in.
  @UseGuards(ScopeGuard)
  @Roles('owner', 'agent', 'super_admin')
  @Post()
  create(@Req() req: any, @Body() body: CreateListingDto) {
    return this.listings.create({
      ...body,
      ownerId: req.user.id,
      agentId: req.user.role === 'agent' ? req.user.agentId : undefined,
    });
  }

  // Same DTO/validation as create() — a draft is a fully-valid listing saved
  // with status='draft' instead of entering the verification queue, not a
  // partially-filled scratch save. See POST /listings/:id/submit to move it
  // into pending_verification once the agent/owner is ready.
  @UseGuards(ScopeGuard)
  @Roles('owner', 'agent', 'super_admin')
  @Post('draft')
  createDraft(@Req() req: any, @Body() body: CreateListingDto) {
    return this.listings.create({
      ...body,
      ownerId: req.user.id,
      agentId: req.user.role === 'agent' ? req.user.agentId : undefined,
      status: 'draft',
    });
  }

  // Self-scoped like update()/remove() below — moves a draft into the
  // verification queue. Only meaningful from status='draft'; setStatus()
  // itself doesn't enforce a from-state, so this is a thin, deliberately
  // narrow entry point rather than exposing the general setStatus write path.
  // assertDocumentsComplete() is the same hard gate already used at
  // approval time (VerificationRepository.recordAction) — without it here,
  // a draft finished via this endpoint (the Property Management/My
  // Properties "Submit" button) could reach pending_verification without
  // ever being routed through the ownership-documents screen, unlike the
  // direct-create path in create() below. Correctly a no-op for
  // agent-authored listings (getDocumentCompleteness exempts them).
  @UseGuards(ScopeGuard)
  @Roles('owner', 'agent', 'super_admin')
  @Post(':id/submit')
  async submitDraft(@Req() req: any, @Param('id') id: string) {
    await this.assertOwnListing(req, id);
    await this.listings.assertDocumentsComplete(id);
    return this.listings.setStatus(id, 'pending_verification');
  }

  // The write path listing_boost_tier never had before this pass — spends
  // one of the agent's plan-granted Hot/Super Hot credits (agent_credits,
  // topped up on tier selection/renewal — see subscriptions module) to
  // feature this specific listing for a fixed window. Agent-only (an owner
  // has no plan/credits to spend); ownership-checked same as every other
  // mutation on this controller.
  @UseGuards(ScopeGuard)
  @Roles('agent')
  @Post(':id/boost')
  async boost(@Req() req: any, @Param('id') id: string, @Body() body: BoostListingDto) {
    await this.assertOwnListing(req, id);
    return this.listings.boost(id, req.user.agentId, body);
  }

  // Resets an expired listing (PlanLifecycleService's cron, once its plan's
  // listing_duration_days lapses) back to 'verified' with a fresh expiry —
  // agent-only, same reasoning as boost: an owner-only listing has no plan
  // to derive a duration from in the first place (it never expires).
  @UseGuards(ScopeGuard)
  @Roles('agent')
  @Post(':id/renew')
  async renew(@Req() req: any, @Param('id') id: string) {
    await this.assertOwnListing(req, id);
    return this.listings.renew(id, req.user.agentId);
  }

  // Photos/videos upload as they're picked on the submit form — before the
  // listing exists, so there's no :id yet. Self-scoped to the uploader's own
  // id (just a storage-path prefix, no ownership row to check against). The
  // returned url is attached to the listing via CreateListingDto.media on
  // the subsequent POST /listings call.
  @UseGuards(ScopeGuard)
  @Roles('owner', 'agent', 'super_admin')
  @Post('media/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadMedia(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.listingMedia.upload(req.user.id, file);
  }

  // Direct lifecycle control — the write-mechanism explicitly deferred in the
  // My Listings pass. super_admin-only: distinct from the verification queue
  // (POST /verification/:id/action), which is scoped to verification_staff
  // and only ever produces verified/rejected/pending_verification.
  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() body: SetListingStatusDto) {
    return this.listings.setStatus(id, body.status);
  }

  // The general-purpose edit an agent/owner never had — self-scoped to their
  // own listing (or super_admin, any). See listings.repository.ts::update()
  // for the re-review-on-edit business rule.
  @UseGuards(ScopeGuard)
  @Roles('owner', 'agent', 'super_admin')
  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: UpdateListingDto) {
    await this.assertOwnListing(req, id);
    return this.listings.update(id, body);
  }

  // Soft delete — reuses the existing 'deleted' status (already a real
  // ListingStatus with its own My Listings tab) rather than a destructive
  // hard delete. Same self-scoping as update() above.
  @UseGuards(ScopeGuard)
  @Roles('owner', 'agent', 'super_admin')
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.assertOwnListing(req, id);
    return this.listings.setStatus(id, 'deleted');
  }

  // Real property-verification requirement — ID card front/back, ownership
  // proof, last utility bill. Owner/agent upload their own listing's
  // documents; verification_staff/super_admin bypass the ownership check
  // since they need to review any listing's documents ahead of approval.
  @UseGuards(ScopeGuard)
  @Roles('owner', 'agent', 'verification_staff', 'super_admin')
  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UploadListingDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.assertCanAccessDocuments(req, id);
    return this.listings.addDocument(id, body.documentType, file);
  }

  @UseGuards(ScopeGuard)
  @Roles('owner', 'agent', 'verification_staff', 'super_admin')
  @Get(':id/documents')
  async listDocuments(@Req() req: any, @Param('id') id: string) {
    await this.assertCanAccessDocuments(req, id);
    return this.listings.listDocuments(id);
  }

  private async assertCanAccessDocuments(req: any, listingId: string) {
    if (req.user.role === 'verification_staff' || req.user.role === 'super_admin') return;

    const { ownerId, agentId } = await this.listings.getOwnership(listingId);
    const isOwner = req.user.role === 'owner' && req.user.id === ownerId;
    const isAssignedAgent = req.user.role === 'agent' && req.user.agentId === agentId;
    if (!isOwner && !isAssignedAgent) {
      throw new ForbiddenException("Cannot access another listing's documents");
    }
  }

  private async assertOwnListing(req: any, listingId: string) {
    if (req.user.role === 'super_admin') return;

    const { ownerId, agentId } = await this.listings.getOwnership(listingId);
    const isOwner = req.user.role === 'owner' && req.user.id === ownerId;
    const isAssignedAgent = req.user.role === 'agent' && req.user.agentId === agentId;
    if (!isOwner && !isAssignedAgent) {
      throw new ForbiddenException('Cannot modify another listing');
    }
  }
}
