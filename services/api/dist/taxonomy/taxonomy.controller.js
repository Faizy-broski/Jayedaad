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
exports.TaxonomyController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../common/decorators/public.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const scope_guard_1 = require("../common/guards/scope.guard");
const taxonomy_repository_1 = require("./taxonomy.repository");
const category_dto_1 = require("./dto/category.dto");
const property_type_dto_1 = require("./dto/property-type.dto");
const amenity_dto_1 = require("./dto/amenity.dto");
let TaxonomyController = class TaxonomyController {
    taxonomy;
    constructor(taxonomy) {
        this.taxonomy = taxonomy;
    }
    // Public reads: every search/filter screen (web, mobile, agent portal,
    // admin panel) needs the same taxonomy lists [Spec §9 cross-platform parity].
    listCategories() {
        return this.taxonomy.listCategories();
    }
    listPropertyTypes() {
        return this.taxonomy.listPropertyTypes();
    }
    // propertyTypeCategorySlug lets a listing-submission form only fetch
    // amenities relevant to the property type being listed.
    listAmenities(propertyTypeCategorySlug) {
        return this.taxonomy.listAmenities({ propertyTypeCategorySlug });
    }
    // Mutations: Super Admin only [Reqs §9] — full CRUD on all three, not just
    // create. Property-type categories (Homes/Plots/Commercial) are managed
    // data, not a fixed enum, so Super Admin can add/rename/retire them too.
    createCategory(body) {
        return this.taxonomy.createCategory(body);
    }
    updateCategory(id, body) {
        return this.taxonomy.updateCategory(id, body);
    }
    removeCategory(id) {
        return this.taxonomy.removeCategory(id);
    }
    createPropertyType(body) {
        return this.taxonomy.createPropertyType(body);
    }
    updatePropertyType(id, body) {
        return this.taxonomy.updatePropertyType(id, body);
    }
    removePropertyType(id) {
        return this.taxonomy.removePropertyType(id);
    }
    createAmenity(body) {
        return this.taxonomy.createAmenity(body);
    }
    updateAmenity(id, body) {
        return this.taxonomy.updateAmenity(id, body);
    }
    removeAmenity(id) {
        return this.taxonomy.removeAmenity(id);
    }
};
exports.TaxonomyController = TaxonomyController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('property-type-categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TaxonomyController.prototype, "listCategories", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('property-types'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TaxonomyController.prototype, "listPropertyTypes", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('amenities'),
    __param(0, (0, common_1.Query)('propertyTypeCategorySlug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TaxonomyController.prototype, "listAmenities", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Post)('property-type-categories'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [category_dto_1.CreatePropertyTypeCategoryDto]),
    __metadata("design:returntype", void 0)
], TaxonomyController.prototype, "createCategory", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Patch)('property-type-categories/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, category_dto_1.UpdatePropertyTypeCategoryDto]),
    __metadata("design:returntype", void 0)
], TaxonomyController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Delete)('property-type-categories/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TaxonomyController.prototype, "removeCategory", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Post)('property-types'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [property_type_dto_1.CreatePropertyTypeDto]),
    __metadata("design:returntype", void 0)
], TaxonomyController.prototype, "createPropertyType", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Patch)('property-types/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, property_type_dto_1.UpdatePropertyTypeDto]),
    __metadata("design:returntype", void 0)
], TaxonomyController.prototype, "updatePropertyType", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Delete)('property-types/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TaxonomyController.prototype, "removePropertyType", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Post)('amenities'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [amenity_dto_1.CreateAmenityDto]),
    __metadata("design:returntype", void 0)
], TaxonomyController.prototype, "createAmenity", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Patch)('amenities/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, amenity_dto_1.UpdateAmenityDto]),
    __metadata("design:returntype", void 0)
], TaxonomyController.prototype, "updateAmenity", null);
__decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.Delete)('amenities/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TaxonomyController.prototype, "removeAmenity", null);
exports.TaxonomyController = TaxonomyController = __decorate([
    (0, common_1.Controller)('taxonomy'),
    __metadata("design:paramtypes", [taxonomy_repository_1.TaxonomyRepository])
], TaxonomyController);
