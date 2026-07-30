import { BadRequestException, Injectable } from '@nestjs/common';
import { OtpRepository } from './otp.repository';
import { MailerService } from './mailer.service';
import { CODE_TTL_MS, assertCodeUsable, assertHashMatches, generateCode, hashCode } from './otp-code.util';

@Injectable()
export class OtpService {
  constructor(
    private readonly repo: OtpRepository,
    private readonly mailer: MailerService,
  ) {}

  async sendCode(userId: string): Promise<{ sent: true }> {
    const alreadyVerified = await this.repo.getEmailVerified(userId);
    if (alreadyVerified) {
      throw new BadRequestException('Email already verified');
    }

    const email = await this.repo.getEmail(userId);
    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    await this.repo.insertCode(userId, hashCode(code), expiresAt, 'email_verification');
    await this.mailer.sendOtpEmail(email, code);

    return { sent: true };
  }

  async verifyCode(userId: string, code: string): Promise<{ verified: true }> {
    const row = await this.repo.findLatestActive(userId, 'email_verification');
    assertCodeUsable(row);

    // Increment before checking so a mid-request crash still counts the attempt.
    await this.repo.incrementAttempt(row.id);
    assertHashMatches(row, code);

    await this.repo.markConsumed(row.id);
    await this.repo.markEmailVerified(userId);

    return { verified: true };
  }

  async getStatus(userId: string): Promise<{ emailVerified: boolean }> {
    const emailVerified = await this.repo.getEmailVerified(userId);
    return { emailVerified };
  }
}
