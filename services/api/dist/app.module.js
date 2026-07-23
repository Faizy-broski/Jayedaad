"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const supabase_module_1 = require("./supabase/supabase.module");
const auth_module_1 = require("./auth/auth.module");
const health_controller_1 = require("./health/health.controller");
const users_module_1 = require("./users/users.module");
const listings_module_1 = require("./listings/listings.module");
const verification_module_1 = require("./verification/verification.module");
const leads_module_1 = require("./leads/leads.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const chatbot_module_1 = require("./chatbot/chatbot.module");
const taxonomy_module_1 = require("./taxonomy/taxonomy.module");
const agencies_module_1 = require("./agencies/agencies.module");
const agents_module_1 = require("./agents/agents.module");
const favorites_module_1 = require("./favorites/favorites.module");
const saved_searches_module_1 = require("./saved-searches/saved-searches.module");
const projects_module_1 = require("./projects/projects.module");
const notifications_module_1 = require("./notifications/notifications.module");
const preferences_module_1 = require("./preferences/preferences.module");
const admin_module_1 = require("./admin/admin.module");
const developers_module_1 = require("./developers/developers.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            supabase_module_1.SupabaseModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            listings_module_1.ListingsModule,
            verification_module_1.VerificationModule,
            leads_module_1.LeadsModule,
            subscriptions_module_1.SubscriptionsModule,
            chatbot_module_1.ChatbotModule,
            taxonomy_module_1.TaxonomyModule,
            agencies_module_1.AgenciesModule,
            agents_module_1.AgentsModule,
            favorites_module_1.FavoritesModule,
            saved_searches_module_1.SavedSearchesModule,
            projects_module_1.ProjectsModule,
            notifications_module_1.NotificationsModule,
            preferences_module_1.PreferencesModule,
            admin_module_1.AdminModule,
            developers_module_1.DevelopersModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
