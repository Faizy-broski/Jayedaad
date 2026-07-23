import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

const ROLES = ['super_admin', 'verification_staff', 'agent', 'buyer', 'owner'] as const;

// Super Admin provisioning a new account directly (email + temporary
// password) — matches [Reqs §9] "Super Admin... Create... any user account,
// including Verification Staff and Agent accounts." An invite-email-based
// flow (supabase.auth.admin.inviteUserByEmail) is a reasonable future
// alternative but not what's built here.
export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(ROLES)
  role!: (typeof ROLES)[number];

  // Only meaningful when role === 'agent' — creates the matching
  // agent_profiles row atomically.
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsUUID()
  agencyId?: string;
}
