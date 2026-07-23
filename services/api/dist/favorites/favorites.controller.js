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
exports.FavoritesController = void 0;
const common_1 = require("@nestjs/common");
const scope_guard_1 = require("../common/guards/scope.guard");
const favorites_repository_1 = require("./favorites.repository");
// Every route requires authentication (no @Public) — a favorites list is
// inherently per-user. No @Roles() needed: any authenticated buyer/owner/
// agent can favorite a listing, scoping happens via req.user.id, never a
// client-supplied user id.
let FavoritesController = class FavoritesController {
    favorites;
    constructor(favorites) {
        this.favorites = favorites;
    }
    list(req) {
        return this.favorites.list(req.user.id);
    }
    add(req, listingId) {
        return this.favorites.add(req.user.id, listingId);
    }
    remove(req, listingId) {
        return this.favorites.remove(req.user.id, listingId);
    }
};
exports.FavoritesController = FavoritesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FavoritesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(':listingId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('listingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FavoritesController.prototype, "add", null);
__decorate([
    (0, common_1.Delete)(':listingId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('listingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FavoritesController.prototype, "remove", null);
exports.FavoritesController = FavoritesController = __decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, common_1.Controller)('favorites'),
    __metadata("design:paramtypes", [favorites_repository_1.FavoritesRepository])
], FavoritesController);
