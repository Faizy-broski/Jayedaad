import { ConflictException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateOwnProfileDto } from './dto/update-profile.dto';

// Self-service counterpart to users.repository.ts (super_admin-only) and
// agents.repository.ts::updateProfile (agent-only) — the plain-profiles
// read/write and account-deletion path every role can use on themselves.
@Injectable()
export class AccountRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async updateProfile(userId: string, input: UpdateOwnProfileDto) {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .update({
        display_name: input.displayName,
        phone: input.phone,
      })
      .eq('id', userId)
      .select('display_name, phone')
      .single();
    if (error) throw error;
    return { displayName: data.display_name, phone: data.phone };
  }

  // listings.owner_id/agent_id and leads.agent_id/lead_assignments.agent_id
  // reference auth.users/agent_profiles with NO cascade [0001 migration] —
  // deleting an account with any listing/lead history hits a raw Postgres
  // FK violation. Caught here and surfaced as a friendly 409 instead of a
  // raw 500, rather than silently succeeding or crashing.
  async deleteAccount(userId: string) {
    const { error } = await this.supabase.client.auth.admin.deleteUser(userId);
    if (error) {
      if (/foreign key/i.test(error.message)) {
        throw new ConflictException(
          'You have active listings or leads tied to your account — remove or transfer them before deleting your account.',
        );
      }
      throw error;
    }
  }
}
