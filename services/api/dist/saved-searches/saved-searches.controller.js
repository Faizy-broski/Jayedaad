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
exports.SavedSearchesController = void 0;
const common_1 = require("@nestjs/common");
const scope_guard_1 = require("../common/guards/scope.guard");
const saved_searches_repository_1 = require("./saved-searches.repository");
const create_saved_search_dto_1 = require("./dto/create-saved-search.dto");
const update_saved_search_dto_1 = require("./dto/update-saved-search.dto");
let SavedSearchesController = class SavedSearchesController {
    savedSearches;
    constructor(savedSearches) {
        this.savedSearches = savedSearches;
    }
    list(req) {
        return this.savedSearches.list(req.user.id);
    }
    create(req, body) {
        return this.savedSearches.create(req.user.id, body);
    }
    update(req, id, body) {
        return this.savedSearches.updateAlertFrequency(req.user.id, id, body.alertFrequency);
    }
    remove(req, id) {
        return this.savedSearches.remove(req.user.id, id);
    }
};
exports.SavedSearchesController = SavedSearchesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SavedSearchesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_saved_search_dto_1.CreateSavedSearchDto]),
    __metadata("design:returntype", void 0)
], SavedSearchesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_saved_search_dto_1.UpdateSavedSearchDto]),
    __metadata("design:returntype", void 0)
], SavedSearchesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SavedSearchesController.prototype, "remove", null);
exports.SavedSearchesController = SavedSearchesController = __decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, common_1.Controller)('saved-searches'),
    __metadata("design:paramtypes", [saved_searches_repository_1.SavedSearchesRepository])
], SavedSearchesController);
