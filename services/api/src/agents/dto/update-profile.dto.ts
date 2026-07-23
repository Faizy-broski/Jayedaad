import { IsOptional, IsString } from 'class-validator';

// Confirmed real on the Profolio "User Settings" page: Name, Mobile,
// Landline, Whatsapp, City, Address (Email is read-only — the account's
// login email, never editable here). photoUrl is set via a separate upload
// step, not this form directly, but included for the same PATCH.
export class UpdateAgentProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  phone?: string; // the real form's "Mobile" field

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  landline?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
