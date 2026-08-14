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

  async markEmailVerified(userId: string) {
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
