import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

const CREDIT_TYPES = ['listing_quota', 'refresh', 'hot', 'super_hot'] as const;

// Super Admin grants/adjusts a credit pool — the write-side counterpart to
// the read-only GET /agents/:id/credits built in the Analytics pass, and
// the actual mechanism that would let boost_tier ever change (an agent
// spends a Hot/Super Hot credit — the spend action itself is still a
// separate, later piece; this just lets Super Admin set balances).
export class GrantCreditsDto {
  @IsIn(CREDIT_TYPES)
  creditType!: (typeof CREDIT_TYPES)[number];

  @IsOptional()
  @IsInt()
  @Min(0)
  total?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  used?: number;
}
