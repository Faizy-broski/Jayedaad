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
exports.PreferencesController = void 0;
const common_1 = require("@nestjs/common");
const scope_guard_1 = require("../common/guards/scope.guard");
const preferences_repository_1 = require("./preferences.repository");
const update_preferences_dto_1 = require("./dto/update-preferences.dto");
// Self-scoped to req.user.id, no @Roles() restriction — any authenticated
// user (buyer/owner/agent/staff/admin) has their own preferences.
let PreferencesController = class PreferencesController {
    preferences;
    constructor(preferences) {
        this.preferences = preferences;
    }
    get(req) {
        return this.preferences.get(req.user.id);
    }
    update(req, body) {
        return this.preferences.update(req.user.id, body);
    }
};
exports.PreferencesController = PreferencesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PreferencesController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_preferences_dto_1.UpdatePreferencesDto]),
    __metadata("design:returntype", void 0)
], PreferencesController.prototype, "update", null);
exports.PreferencesController = PreferencesController = __decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, common_1.Controller)('preferences'),
    __metadata("design:paramtypes", [preferences_repository_1.PreferencesRepository])
], PreferencesController);
