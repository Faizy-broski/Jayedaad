import { Type } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { CreateProjectPaymentPlanDto, CreateProjectUnitTypeDto } from './create-project.dto';

const PROJECT_STATUSES = ['planned', 'under_construction', 'ready', 'draft'] as const;

// Full-page-form edit (not a partial PATCH-a-few-fields UI) — unitTypes/
// paymentPlans/amenitySlugs, when present, replace the project's existing
// rows entirely (delete + reinsert in ProjectsRepository.update), same as
// how the create form always submits the complete current state.
export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsUUID()
  developerId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsIn(PROJECT_STATUSES)
  status?: (typeof PROJECT_STATUSES)[number];

  @IsOptional()
  @IsString()
  possessionDate?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImageUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  floorPlanUrls?: string[];

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  brochureUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectUnitTypeDto)
  unitTypes?: CreateProjectUnitTypeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectPaymentPlanDto)
  paymentPlans?: CreateProjectPaymentPlanDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenitySlugs?: string[];
}
