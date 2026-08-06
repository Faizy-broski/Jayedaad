import { IsEmail, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateAgencyDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

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

  // Optional here (unlike RegisterAgencyDto's mandatory version) — an
  // admin-created agency falls back to the sales_associate_count column's
  // DB default (1) when omitted (see 0032_agency_sales_associate_count.sql).
  @IsOptional()
  @IsInt()
  @Min(1)
  salesAssociateCount?: number;
}
