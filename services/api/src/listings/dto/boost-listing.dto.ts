import { IsIn } from 'class-validator';

export class BoostListingDto {
  @IsIn(['hot', 'super_hot'])
  boostTier!: 'hot' | 'super_hot';
}
