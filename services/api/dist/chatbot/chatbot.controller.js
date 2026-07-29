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
exports.ChatbotController = void 0;
const common_1 = require("@nestjs/common");
const scope_guard_1 = require("../common/guards/scope.guard");
const role_capability_resolver_1 = require("./role-capability.resolver");
// Every authenticated role can talk to the chatbot — the manifest, not the
// route, is what changes per role [Spec §3].
let ChatbotController = class ChatbotController {
    capabilities;
    constructor(capabilities) {
        this.capabilities = capabilities;
    }
    async handleMessage(req, _message) {
        const tools = this.capabilities.resolve(req.user.role);
        // Explicitly descoped from this release, not a silent gap — no LLM
        // provider has been chosen yet (see LLM_PROVIDER_API_KEY in
        // .env.example). `implemented: false` lets callers branch on this
        // programmatically instead of pattern-matching the reply text.
        return {
            implemented: false,
            reply: 'Chatbot integration is not yet available.',
            availableTools: tools,
        };
    }
};
exports.ChatbotController = ChatbotController;
__decorate([
    (0, common_1.Post)('message'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('message')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatbotController.prototype, "handleMessage", null);
exports.ChatbotController = ChatbotController = __decorate([
    (0, common_1.UseGuards)(scope_guard_1.ScopeGuard),
    (0, common_1.Controller)('chatbot'),
    __metadata("design:paramtypes", [role_capability_resolver_1.RoleCapabilityResolver])
], ChatbotController);
