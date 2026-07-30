import { BadRequestException, Injectable } from '@nestjs/common';
import { OtpRepository } from '../otp/otp.repository';
import { MailerService } from '../otp/mailer.service';
import { CODE_TTL_MS, assertCodeUsable, assertHashMatches, generateCode, hashCode } from '../otp/otp-code.util';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly repo: OtpRepository,
    private readonly mailer: MailerService,
    private readonly supabase: SupabaseService,
  ) {}

  async requestReset(email: string): Promise<{ sent: true }> {
    const userId = await this.repo.findUserIdByEmail(email);

    // Always the same response whether or not the email matched an account —
    // this endpoint is unauthenticated by nature, so confirming/denying
    // account existence here would be a user-enumeration vector.
    if (userId) {
      const code = generateCode();
      const expiresAt = new Date(Date.now() + CODE_TTL_MS);
      await this.repo.insertCode(userId, hashCode(code), expiresAt, 'password_reset');
      await this.mailer.sendPasswordResetEmail(email, code);
    }

    return { sent: true };
  }

  async confirmReset(email: string, code: string, newPassword: string): Promise<{ reset: true }> {
    const userId = await this.repo.findUserIdByEmail(email);
    if (!userId) {
      // Same generic error as an invalid code — don't distinguish "no such
      // account" from "wrong code" for the same anti-enumeration reason.
      throw new BadRequestException('Incorrect code');
    }

    const row = await this.repo.findLatestActive(userId, 'password_reset');
    assertCodeUsable(row);

    await this.repo.incrementAttempt(row.id);
    assertHashMatches(row, code);

    await this.repo.markConsumed(row.id);

    // Only callable server-side with the service-role key — this is the
    // entire reason this flow needs a backend endpoint rather than anything
    // client-side; there is no Supabase reset-link email involved at all.
    const { error } = await this.supabase.client.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) throw error;

    return { reset: true };
  }
}
