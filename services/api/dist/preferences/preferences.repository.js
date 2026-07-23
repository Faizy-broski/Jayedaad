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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferencesRepository = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const DEFAULTS = {
    emailNotifications: true,
    newsletters: false,
    automatedReports: false,
    preferredCurrency: 'PKR',
    preferredAreaUnit: 'marla',
};
function mapRow(row) {
    return {
        emailNotifications: row.email_notifications,
        newsletters: row.newsletters,
        automatedReports: row.automated_reports,
        preferredCurrency: row.preferred_currency,
        preferredAreaUnit: row.preferred_area_unit,
    };
}
// Confirmed real on the Profolio "Preferences" page — a concept that didn't
// exist anywhere before this pass. Any authenticated user has preferences,
// not just agents (email/newsletter opt-ins are account-wide).
let PreferencesRepository = class PreferencesRepository {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async get(userId) {
        const { data, error } = await this.supabase.client
            .from('user_preferences')
            .select('email_notifications, newsletters, automated_reports, preferred_currency, preferred_area_unit')
            .eq('user_id', userId)
            .maybeSingle();
        if (error)
            throw error;
        // No row yet (new user) — return defaults rather than writing on every
        // read; a row is only created the first time preferences are updated.
        return data ? mapRow(data) : DEFAULTS;
    }
    async update(userId, input) {
        const { data, error } = await this.supabase.client
            .from('user_preferences')
            .upsert({
            user_id: userId,
            email_notifications: input.emailNotifications,
            newsletters: input.newsletters,
            automated_reports: input.automatedReports,
            preferred_currency: input.preferredCurrency,
            preferred_area_unit: input.preferredAreaUnit,
        }, { onConflict: 'user_id' })
            .select('email_notifications, newsletters, automated_reports, preferred_currency, preferred_area_unit')
            .single();
        if (error)
            throw error;
        return mapRow(data);
    }
};
exports.PreferencesRepository = PreferencesRepository;
exports.PreferencesRepository = PreferencesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], PreferencesRepository);
