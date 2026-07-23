import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePropertyTypeDto {
  @IsString()
  slug!: string;

  @IsString()
  label!: string;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdatePropertyTypeDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
