"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleCapabilityResolver = void 0;
const common_1 = require("@nestjs/common");
// One assistant, capabilities modeled per role [Spec §3 / Reqs §3.1]. The
// lister flow's manifest structurally EXCLUDES any verification-decision tool —
// per [Spec §3]/[Reqs §3.4] the bot must never verify a listing, so that
// guarantee lives here (no such tool exists for 'owner'), not in a prompt
// instruction that could be bypassed by a clever user message.
const ROLE_TOOL_MANIFESTS = {
    buyer: ['search_listings', 'capture_lead', 'get_expert_contact'],
    agent: ['rank_listings_for_price_reduction', 'portfolio_insights', 'get_expert_contact'],
    owner: ['intake_documents', 'intake_photos', 'get_expert_contact'],
};
let RoleCapabilityResolver = class RoleCapabilityResolver {
    resolve(role) {
        return ROLE_TOOL_MANIFESTS[role] ?? ['get_expert_contact'];
    }
};
exports.RoleCapabilityResolver = RoleCapabilityResolver;
exports.RoleCapabilityResolver = RoleCapabilityResolver = __decorate([
    (0, common_1.Injectable)()
], RoleCapabilityResolver);
