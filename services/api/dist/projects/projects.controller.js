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
exports.ProjectsController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../common/decorators/public.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const scope_guard_1 = require("../common/guards/scope.guard");
const projects_repository_1 = require("./projects.repository");
const create_project_dto_1 = require("./dto/create-project.dto");
let ProjectsController = class ProjectsController {
    projects;
    constructor(projects) {
        this.projects = projects;
    }
    // Public, unauthenticated — confirmed real on the Zameen New Projects
    // search page: City, Property Type (via the category taxonomy), Budget
    // Range, Area Range, Project Title (keyword) and Developer filters, plus
    // sort/pagination. Mirrors ListingsController.findPublic.
    findPublic(city, status, propertyTypeSlug, developerSlug, minPrice, maxPrice, minAreaValue, maxAreaValue, areaUnit, keyword, sortBy, page, pageSize) {
        return this.projects.findPublic({
            city,
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
    // Backs "Browse Projects by City" (Islamabad 285, Lahore 219, ...).
    listCities() {
        return this.projects.listCitiesWithCounts();
    }
    // Backs "Browse Projects by Category" (Flats 486, Plots 427, ...).
    listCategories() {
        return this.projects.listCategoriesWithCounts();
    }
    findBySlug(slug) {
        return this.projects.findBySlug(slug);
    }
    // Developer/project onboarding — Super Admin or agent (matches the same
    // roles allowed to submit listings) [Spec §7].
    create(body) {
        return this.projects.create(body);
    }
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('city')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('propertyTypeSlug')),
    __param(3, (0, common_1.Query)('developerSlug')),
    __param(4, (0, common_1.Query)('minPrice')),
    __param(5, (0, common_1.Query)('maxPrice')),
    __param(6, (0, common_1.Query)('minAreaValue')),
    __param(7, (0, common_1.Query)('maxAreaValue')),
    __param(8, (0, common_1.Query)('areaUnit')),
    __param(9, (0, common_1.Query)('keyword')),
    __param(10, (0, common_1.Query)('sortBy')),
    __param(11, (0, common_1.Query)('page')),
    __param(12, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "findPublic", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('cities'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "listCities", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "listCategories", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('agent', 'super_admin'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_project_dto_1.CreateProjectDto]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "create", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, common_1.Controller)('projects'),
    __metadata("design:paramtypes", [projects_repository_1.ProjectsRepository])
], ProjectsController);
