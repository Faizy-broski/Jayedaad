import { IsIn } from 'class-validator';

// Mirrors listings/dto/boost-listing.dto.ts exactly — same shape, kept as
// a separate class (not shared/imported) matching this codebase's
// per-module DTO convention.
export class BoostProjectDto {
  @IsIn(['hot', 'super_hot'])
  boostTier!: 'hot' | 'super_hot';
}
