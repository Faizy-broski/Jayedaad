import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-role.dto';
import { Role } from '../common/types';
import { paginate, PaginationParams, resolvePagination, sanitizeKeyword } from '../common/pagination';

// Full account lifecycle for Super Admin [Reqs §9]: "Create, edit, suspend,
// and delete any user account, including Verification Staff and Agent
// accounts." Uses the Supabase Admin API (service-role client, already
// wired via SupabaseService) — identity lives in Supabase Auth, this API
// never manages passwords/sessions directly, only orchestrates the Admin API.
@Injectable()
export class UsersRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async findById(id: string) {
    const { data, error } = await this.supabase.client.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  }

  // Backs the Super Admin "team members" screen — `roles` filters to just
  // internal staff (e.g. ?role=super_admin,verification_staff) instead of
  // the full user base (buyers/owners/agents included). Dual-mode: called
  // with no page/pageSize, returns the full unpaginated array exactly as
  // before — needed by Verification Log's reviewer-name lookup, which
  // resolves reviewerId -> displayName/email against the whole roster, not
  // just one page. Called with page and/or pageSize, it paginates and
  // returns { items, total, page, pageSize } for the Users admin table. See
  // services/api/src/common/pagination.ts and admin.repository.ts::
  // listAgentsOverview for the same pattern applied elsewhere.
  async list(filters: PaginationParams & { roles?: Role[]; search?: string } = {}) {
    const paginated = filters.page != null || filters.pageSize != null;

    let query = this.supabase.client
      .from('profiles')
      .select('*', paginated ? { count: 'exact' } : undefined)
      .order('created_at', { ascending: false });

    if (filters.roles?.length) query = query.in('role', filters.roles);

    if (!paginated) {
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    }

    const pagination = resolvePagination(filters);
    if (filters.search) {
      const term = sanitizeKeyword(filters.search);
      if (term) query = query.or(`display_name.ilike.%${term}%,email.ilike.%${term}%`);
    }
    query = query.range(pagination.from, pagination.to);

    return paginate(query, pagination);
  }

  // role/agent_id land in app_metadata at creation time — the same
  // tamper-proof claim JwtAuthGuard already reads, set only via this
  // service-role-authenticated path, never by the user themselves.
  // display_name is now included for every role (previously only threaded
  // through to agent_profiles in the agent branch below) — the
  // handle_new_user() trigger [0002 migration] copies it into
  // profiles.display_name/profiles.email so team member accounts have a
  // human-readable name, not just an opaque UUID + role.
  async create(input: CreateUserDto) {
    const { data: created, error: createError } = await this.supabase.client.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      app_metadata: { role: input.role, display_name: input.displayName },
    });
    if (createError) throw createError;
    const userId = created.user.id;

    if (input.role === 'agent') {
      const { data: agentProfile, error: agentError } = await this.supabase.client
        .from('agent_profiles')
        .insert({
          user_id: userId,
          display_name: input.displayName,
          agency_id: input.agencyId,
          phone: input.phone,
          city: input.city,
        })
        .select('id')
        .single();
      if (agentError) throw agentError;

      const { error: backfillError } = await this.supabase.client.auth.admin.updateUserById(userId, {
        app_metadata: { role: 'agent', agent_id: agentProfile.id, display_name: input.displayName },
      });
      if (backfillError) throw backfillError;

      // Mirrors the JWT app_metadata backfill above but for profiles.agent_id
      // — previously left null for every admin-created agent (only the JWT
      // claim was ever set), so AdminUser.agentId (read by the frontend to
      // immediately upload this agent's onboarding documents right after
      // creation) was always null despite the agent_profiles row existing.
      const { error: profileBackfillError } = await this.supabase.client
        .from('profiles')
        .update({ agent_id: agentProfile.id })
        .eq('id', userId);
      if (profileBackfillError) throw profileBackfillError;
    }

    return this.findById(userId);
  }

  // Merges into existing app_metadata (preserving agent_id if present)
  // rather than overwriting it outright, and keeps profiles.role in sync
  // for SQL-side joins/consistency.
  async updateRole(id: string, input: UpdateUserRoleDto) {
    const { data: existing, error: getError } = await this.supabase.client.auth.admin.getUserById(id);
    if (getError) throw getError;

    const { error: updateError } = await this.supabase.client.auth.admin.updateUserById(id, {
      app_metadata: { ...existing.user.app_metadata, role: input.role },
    });
    if (updateError) throw updateError;

    const { error: profileError } = await this.supabase.client
      .from('profiles')
      .update({ role: input.role })
      .eq('id', id);
    if (profileError) throw profileError;

    return this.findById(id);
  }

  // ~100 years is Supabase's own documented convention for an effectively
  // permanent ban via ban_duration (there's no literal "forever" value).
  async suspend(id: string) {
    const { error } = await this.supabase.client.auth.admin.updateUserById(id, { ban_duration: '876000h' });
    if (error) throw error;
  }

  async unsuspend(id: string) {
    const { error } = await this.supabase.client.auth.admin.updateUserById(id, { ban_duration: 'none' });
    if (error) throw error;
  }

  // agent_profiles.user_id has ON DELETE CASCADE [0006 migration] — deleting
  // the auth user automatically cleans up their agent profile, subscription,
  // credits, etc.
  async remove(id: string) {
    const { error } = await this.supabase.client.auth.admin.deleteUser(id);
    if (error) throw error;
  }
}
