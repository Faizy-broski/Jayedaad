"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const public_decorator_1 = require("../common/decorators/public.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const scope_guard_1 = require("../common/guards/scope.guard");
const listings_repository_1 = require("./listings.repository");
const create_listing_dto_1 = require("./dto/create-listing.dto");
const track_engagement_dto_1 = require("./dto/track-engagement.dto");
const set_status_dto_1 = require("./dto/set-status.dto");
const upload_document_dto_1 = require("./dto/upload-document.dto");
let ListingsController = class ListingsController {
    listings;
    constructor(listings) {
        this.listings = listings;
    }
    // Public, unauthenticated — verified-only, identical response whether called
    // from Web, Mobile, Agent Portal, or Admin Panel [Spec §9]. Filters mirror
    // the real Zameen.com search page's facets, including price range, keyword,
    // furnishing, video, and agency — plus sort/pagination and a
    // search_queries log for platform analytics [Reqs §4.2].
    findPublic(req, city, area, propertyTypeSlug, purpose, bedrooms, minBathrooms, minAreaValue, maxAreaValue, areaUnit, minPrice, maxPrice, keyword, furnishingStatus, hasVideo, agencySlug, sortBy, page, pageSize) {
        return this.listings.findPublic({
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
        }, req.user?.id);
    }
    // Powers the hierarchical City -> Area location picker on the real Zameen
    // search page — nothing populated this before this pass.
    listCities() {
        return this.listings.listCities();
    }
    listAreas(city) {
        return this.listings.listAreas(city);
    }
    // "Similar properties" section seen on real Zameen detail pages — same
    // city + property type, excluding the listing itself.
    findSimilar(id) {
        return this.listings.findSimilar(id);
    }
    // Backs the Views/Clicks/Calls/WhatsApp/SMS/Emails metrics confirmed real
    // on the Profolio agent dashboard's Analytics card — public, any visitor
    // triggers these, not just authenticated users.
    trackEngagement(id, body) {
        return this.listings.trackEngagement(id, body);
    }
    // Owner/seller dashboard ("manage submissions, track verification status"
    // [Spec §8]) AND the agent Profolio "My Listings" page — role-aware:
    // owners see what they submitted, agents see what they're assigned to,
    // super_admin sees everything. Filters confirmed real on the live
    // Profolio "My Listings" filter panel.
    findMine(req, status, propertyTypeCategory, propertyTypeSlug, purpose, listingId, minPrice, maxPrice, minAreaValue, maxAreaValue, areaUnit, listedDateFrom, listedDateTo, page, pageSize) {
        return this.listings.findMine({ userId: req.user.id, role: req.user.role, agentId: req.user.agentId }, {
            status,
            propertyTypeCategory,
            propertyTypeSlug,
            purpose,
            listingId,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            minAreaValue: minAreaValue ? Number(minAreaValue) : undefined,
            maxAreaValue: maxAreaValue ? Number(maxAreaValue) : undefined,
            areaUnit,
            listedDateFrom,
            listedDateTo,
            page: page ? Number(page) : undefined,
            pageSize: pageSize ? Number(pageSize) : undefined,
        });
    }
    // Backs the status tab badges ("Active (0)", "Pending (0)", etc.) on the
    // real Profolio "My Listings" page.
    getMyStatusCounts(req) {
        return this.listings.getStatusCounts({ userId: req.user.id, role: req.user.role, agentId: req.user.agentId });
    }
    // The property detail page itself — confirmed real via a scraped Zameen
    // listing detail page. Declared AFTER 'mine'/'mine/status-counts' above:
    // those are literal single/two-segment routes competing for the same
    // position as this bare :id param, and Nest/Express try routes in
    // declaration order — placed earlier, :id would swallow /listings/mine.
    findById(id) {
        return this.listings.findById(id);
    }
    // Submission entry point for the Manual Verification workflow [Spec §7].
    // owner_id/agent_id/status are all forced from the authenticated request —
    // the DTO cannot influence who owns the listing or what state it starts in.
    create(req, body) {
        return this.listings.create({
            ...body,
            ownerId: req.user.id,
            agentId: req.user.role === 'agent' ? req.user.agentId : undefined,
        });
    }
    // Direct lifecycle control — the write-mechanism explicitly deferred in the
    // My Listings pass. super_admin-only: distinct from the verification queue
    // (POST /verification/:id/action), which is scoped to verification_staff
    // and only ever produces verified/rejected/pending_verification.
    setStatus(id, body) {
        return this.listings.setStatus(id, body.status);
    }
    // Real property-verification requirement — ID card front/back, ownership
    // proof, last utility bill. Owner/agent upload their own listing's
    // documents; verification_staff/super_admin bypass the ownership check
    // since they need to review any listing's documents ahead of approval.
    async uploadDocument(req, id, body, file) {
        await this.assertCanAccessDocuments(req, id);
        return this.listings.addDocument(id, body.documentType, file);
    }
    async listDocuments(req, id) {
        await this.assertCanAccessDocuments(req, id);
        return this.listings.listDocuments(id);
    }
    async assertCanAccessDocuments(req, listingId) {
        if (req.user.role === 'verification_staff' || req.user.role === 'super_admin')
            return;
        const { ownerId, agentId } = await this.listings.getOwnership(listingId);
        const isOwner = req.user.role === 'owner' && req.user.id === ownerId;
        const isAssignedAgent = req.user.role === 'agent' && req.user.agentId === agentId;
        if (!isOwner && !isAssignedAgent) {
            throw new common_1.ForbiddenException("Cannot access another listing's documents");
        }
    }
};
exports.ListingsController = ListingsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('city')),
    __param(2, (0, common_1.Query)('area')),
    __param(3, (0, common_1.Query)('propertyTypeSlug')),
    __param(4, (0, common_1.Query)('purpose')),
    __param(5, (0, common_1.Query)('bedrooms')),
    __param(6, (0, common_1.Query)('minBathrooms')),
    __param(7, (0, common_1.Query)('minAreaValue')),
    __param(8, (0, common_1.Query)('maxAreaValue')),
    __param(9, (0, common_1.Query)('areaUnit')),
    __param(10, (0, common_1.Query)('minPrice')),
    __param(11, (0, common_1.Query)('maxPrice')),
    __param(12, (0, common_1.Query)('keyword')),
    __param(13, (0, common_1.Query)('furnishingStatus')),
    __param(14, (0, common_1.Query)('hasVideo')),
    __param(15, (0, common_1.Query)('agencySlug')),
    __param(16, (0, common_1.Query)('sortBy')),
    __param(17, (0, common_1.Query)('page')),
    __param(18, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "findPublic", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('locations/cities'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "listCities", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('locations/areas'),
    __param(0, (0, common_1.Query)('city')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "listAreas", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/similar'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "findSimilar", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(':id/track'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, track_engagement_dto_1.TrackEngagementDto]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "trackEngagement", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('owner', 'agent', 'super_admin'),
    (0, common_1.Get)('mine'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('propertyTypeCategory')),
    __param(3, (0, common_1.Query)('propertyTypeSlug')),
    __param(4, (0, common_1.Query)('purpose')),
    __param(5, (0, common_1.Query)('listingId')),
    __param(6, (0, common_1.Query)('minPrice')),
    __param(7, (0, common_1.Query)('maxPrice')),
    __param(8, (0, common_1.Query)('minAreaValue')),
    __param(9, (0, common_1.Query)('maxAreaValue')),
    __param(10, (0, common_1.Query)('areaUnit')),
    __param(11, (0, common_1.Query)('listedDateFrom')),
    __param(12, (0, common_1.Query)('listedDateTo')),
    __param(13, (0, common_1.Query)('page')),
    __param(14, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "findMine", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('owner', 'agent', 'super_admin'),
    (0, common_1.Get)('mine/status-counts'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "getMyStatusCounts", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "findById", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('owner', 'agent', 'super_admin'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_listing_dto_1.CreateListingDto]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, set_status_dto_1.SetListingStatusDto]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "setStatus", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('owner', 'agent', 'verification_staff', 'super_admin'),
    (0, common_1.Post)(':id/documents'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, upload_document_dto_1.UploadListingDocumentDto, Object]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('owner', 'agent', 'verification_staff', 'super_admin'),
    (0, common_1.Get)(':id/documents'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "listDocuments", null);
exports.ListingsController = ListingsController = __decorate([
    (0, common_1.Controller)('listings'),
    __metadata("design:paramtypes", [listings_repository_1.ListingsRepository])
], ListingsController);
