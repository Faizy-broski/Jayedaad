import { IsOptional, IsString } from 'class-validator';

// Self-service "Apply to become an agent" — no agencyId here (deliberately):
// self-service applicants always start independent, matching Zameen's model
// where agencies are onboarded separately by staff, not chosen at signup.
// Same fields CreateUserDto accepts for its agent branch, minus email/password
// (the applicant is already an authenticated buyer).
export class ApplyAsAgentDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
