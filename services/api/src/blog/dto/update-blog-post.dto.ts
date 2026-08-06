import { IsOptional, IsString, IsUUID } from 'class-validator';

// slug/status intentionally excluded — slug is immutable after creation
// (matches Developer's disabled slug field), status changes go through the
// dedicated PATCH :id/status route instead of being silently overwritten by
// a general content edit.
export class UpdateBlogPostDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  readTime?: string;
}
