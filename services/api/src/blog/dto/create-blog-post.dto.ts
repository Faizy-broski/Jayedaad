import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

const BLOG_POST_STATUSES = ['draft', 'published'] as const;

export class CreateBlogPostDto {
  @IsString()
  title!: string;

  @IsString()
  slug!: string;

  @IsString()
  content!: string;

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

  // Defaults to 'draft' server-side if omitted — see BlogRepository.create().
  @IsOptional()
  @IsIn(BLOG_POST_STATUSES)
  status?: (typeof BLOG_POST_STATUSES)[number];
}
