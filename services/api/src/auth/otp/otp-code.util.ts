import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { randomInt, createHash } from 'crypto';

export const CODE_TTL_MS = 10 * 60 * 1000;

export function generateCode(): string {
  return String(randomInt(100000, 1000000));
}

export function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export interface OtpCodeRow {
  id: string;
  code_hash: string;
  expires_at: string;
  attempt_count: number;
  max_attempts: number;
}

// Split into two steps (not one combined check) so callers can increment the
// attempt counter *between* them — the counter must be written before the
// hash is compared, so a mid-request crash still counts the attempt. Shared
// by OtpService (email verification) and PasswordResetService, which differ
// only in what happens *after* a code is confirmed valid.
export function assertCodeUsable(row: OtpCodeRow | null): asserts row is OtpCodeRow {
  if (!row) {
    throw new BadRequestException('No active code — request a new one');
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new BadRequestException('Code expired — request a new one');
  }
  if (row.attempt_count >= row.max_attempts) {
    throw new ForbiddenException('Too many attempts — request a new code');
  }
}

export function assertHashMatches(row: OtpCodeRow, submittedCode: string): void {
  if (hashCode(submittedCode) !== row.code_hash) {
    throw new BadRequestException('Incorrect code');
  }
}
