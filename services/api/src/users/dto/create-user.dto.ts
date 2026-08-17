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

  // Agent-only fields, same as the self-service become-an-agent flow
  // collects (apply-as-agent.dto.ts) — previously missing here entirely,
  // leaving an admin-created agent's phone/city permanently null.
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  city?: string;

  // Deferred-upload, any role — the Add User modal uploads via
  // POST /agents/photo/upload first (already super_admin-permitted) and
  // passes the resulting URL here, same "upload before the entity exists"
  // convention as CreateAgencyStaffInput.photoUrl.
  @IsOptional()
  @IsString()
  photoUrl?: string;
}
