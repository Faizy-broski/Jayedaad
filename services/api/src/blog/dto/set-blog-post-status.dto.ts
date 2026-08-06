import { IsIn } from 'class-validator';

export class SetBlogPostStatusDto {
  @IsIn(['draft', 'published'])
  status!: 'draft' | 'published';
}
