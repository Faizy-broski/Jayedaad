import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Single Supabase client, server-side only, using the SERVICE ROLE key —
// bypasses RLS because the API already enforces scoping via ScopeGuard +
// repository-level filtering (see leads.repository.ts). RLS policies in
// supabase/migrations/0004_rls_policies.sql remain as defense-in-depth for
// any future client that queries Postgres directly.
@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
}
