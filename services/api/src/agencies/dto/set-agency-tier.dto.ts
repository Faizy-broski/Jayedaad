import { IsIn } from 'class-validator';

export class SetAgencyTierDto {
  @IsIn(['titanium', 'featured', 'basic'])
  tier!: 'titanium' | 'featured' | 'basic';
}
