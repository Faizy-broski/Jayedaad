import { IsEmail, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateAgencyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  businessHours?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  salesAssociateCount?: number;

  // Percent (0-100) — falls back to DealsRepository's
  // PLATFORM_DEFAULT_COMMISSION_RATE when unset. Same admin-only write path
  // as every other field here (AgenciesController.update's
  // assertCanManageAgency check).
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultCommissionRate?: number;
}
