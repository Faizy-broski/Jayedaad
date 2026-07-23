import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePropertyTypeCategoryDto {
  @IsString()
  slug!: string;

  @IsString()
  label!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdatePropertyTypeCategoryDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
