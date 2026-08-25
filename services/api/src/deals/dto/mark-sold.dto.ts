import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

// Shared fields between mark-sold/mark-rented — commissionRate/closedAt/
// notes are identical in shape across both actions; only the "amount"
// field's name/meaning differs (sale price vs monthly rent), so each
// subclass below adds just that one field.
export class MarkDealBaseDto {
  // Percent (0-100). Overrides the agency's default_commission_rate for
  // this one deal — see DealsRepository.markSold/markRented for the
  // per-deal -> agency-default -> PLATFORM_DEFAULT_COMMISSION_RATE fallback.
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  // Defaults to today (server-side) when omitted — see DealsRepository.
  @IsOptional()
  @IsDateString()
  closedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class MarkSoldDto extends MarkDealBaseDto {
  @IsNumber()
  @IsPositive()
  salePrice!: number;
}
