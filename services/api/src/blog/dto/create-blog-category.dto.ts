import { IsString } from 'class-validator';

// slug is computed client-side (via packages/core's slugify()) and passed
// through, same convention as RegisterAgencyDto.agencySlug — the unique
// constraint on blog_categories.slug catches collisions server-side.
export class CreateBlogCategoryDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;
}
