import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

const DEFAULTS = {
  emailNotifications: true,
  newsletters: false,
  automatedReports: false,
  preferredCurrency: 'PKR',
  preferredAreaUnit: 'marla' as const,
};

function mapRow(row: any) {
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
@Injectable()
export class PreferencesRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async get(userId: string) {
    const { data, error } = await this.supabase.client
      .from('user_preferences')
      .select('email_notifications, newsletters, automated_reports, preferred_currency, preferred_area_unit')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    // No row yet (new user) — return defaults rather than writing on every
    // read; a row is only created the first time preferences are updated.
    return data ? mapRow(data) : DEFAULTS;
  }

  async update(userId: string, input: UpdatePreferencesDto) {
    const { data, error } = await this.supabase.client
      .from('user_preferences')
      .upsert(
        {
          user_id: userId,
          email_notifications: input.emailNotifications,
          newsletters: input.newsletters,
          automated_reports: input.automatedReports,
          preferred_currency: input.preferredCurrency,
          preferred_area_unit: input.preferredAreaUnit,
        },
        { onConflict: 'user_id' },
      )
      .select('email_notifications, newsletters, automated_reports, preferred_currency, preferred_area_unit')
      .single();
    if (error) throw error;
    return mapRow(data);
  }
}
