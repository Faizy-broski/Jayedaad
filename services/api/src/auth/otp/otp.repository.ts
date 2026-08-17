import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

export type OtpPurpose = 'email_verification' | 'password_reset';

@Injectable()
export class OtpRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async insertCode(userId: string, codeHash: string, expiresAt: Date, purpose: OtpPurpose) {
    const { error } = await this.supabase.client.from('email_otp_codes').insert({
      user_id: userId,
      code_hash: codeHash,
      expires_at: expiresAt.toISOString(),
      purpose,
    });
    if (error) throw error;
  }

  async findLatestActive(userId: string, purpose: OtpPurpose) {
    const { data, error } = await this.supabase.client
      .from('email_otp_codes')
      .select('id, code_hash, expires_at, attempt_count, max_attempts')
      .eq('user_id', userId)
      .eq('purpose', purpose)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async incrementAttempt(id: string) {
    const { error } = await this.supabase.client.rpc('increment_email_otp_attempt', { p_id: id });
    if (error) throw error;
  }

  async markConsumed(id: string) {
    const { error } = await this.supabase.client
      .from('email_otp_codes')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  // A valid Supabase JWT can outlive the `profiles` row it points to — the
  // token stays cryptographically valid even after the user (or their row)
  // is deleted, since deletion doesn't revoke already-issued access tokens.
  // .single() would throw Postgrest's raw "no rows" error in that case,
  // surfacing as an opaque 500 (this is exactly what happened investigating
  // a stuck OTP screen for a manually-deleted test account). A missing
  // profile for an otherwise-valid token means the session itself is stale,
  // not a server error — treat it as an auth failure so the client's normal
  // 401 handling (sign the user out) kicks in instead.
  async getEmailVerified(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('email_verified')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new UnauthorizedException('Your session is no longer valid — please sign in again.');
    return data.email_verified;
  }

  async getEmail(userId: string): Promise<string> {
    const { data, error } = await this.supabase.client.from('profiles').select('email').eq('id', userId).maybeSingle();
    if (error) throw error;
    if (!data) throw new UnauthorizedException('Your session is no longer valid — please sign in again.');
    return data.email;
  }

  // app_metadata is baked into the user's JWT, so this claim is readable
  // client-side with zero network round trips (same pattern already used
  // for role/agent_id — see AgentsRepository.promote's updateUserById
  // call). Stamped FIRST and allowed to throw: it becomes the source of
  // truth clients read from, so a silent failure here (while profiles
  // still got updated below) would leave a user verified in the DB
  // forever but invisible to the JWT-based check, with nothing surfacing
  // the drift. Failing loudly instead just means "try again", a normal,
  // recoverable OTP-retry — not a silent permanent gap.
  async markEmailVerified(userId: string) {
    const { data: existing, error: getError } = await this.supabase.client.auth.admin.getUserById(userId);
    if (getError) throw getError;

    const { error: metadataError } = await this.supabase.client.auth.admin.updateUserById(userId, {
      app_metadata: { ...existing.user.app_metadata, email_verified: true },
    });
    if (metadataError) throw metadataError;

    const { error } = await this.supabase.client.from('profiles').update({ email_verified: true }).eq('id', userId);
    if (error) throw error;
  }

  // Password reset starts from an email, not a session — profiles.email is
  // an unguarded column (no admin API needed for this lookup, unlike the
  // actual password change later, which does require it).
  async findUserIdByEmail(email: string): Promise<string | null> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    return data?.id ?? null;
  }
}
