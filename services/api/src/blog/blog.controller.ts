import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';
import { BlogRepository } from './blog.repository';
import { BlogMediaService } from './blog-media.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { SetBlogPostStatusDto } from './dto/set-blog-post-status.dto';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';

@Controller('blog')
export class BlogController {
  constructor(
    private readonly blog: BlogRepository,
    private readonly blogMedia: BlogMediaService,
  ) {}

  // Public reads — always status='published', mirrors
  // agencies.controller.ts's @Public() list/detail + @Roles('super_admin')
  // write mix in one controller.
  @Public()
  @Get()
  list(@Query('limit') limit?: string) {
    return this.blog.listPublished({ limit: limit ? Number(limit) : undefined });
  }

  // Declared before the 1-segment public detail route below purely for
  // readability — no actual route-order conflict, since these are
  // 2-segment paths (/blog/admin/all, /blog/admin/:id) and can never match
  // GET /blog/:slug's single-segment pattern.
  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Get('admin/all')
  listAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string) {
    return this.blog.listAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search,
    });
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Get('admin/:id')
  findById(@Param('id') id: string) {
    return this.blog.findById(id);
  }

  // Declared before the :slug route below — 'categories' is a single path
  // segment and would otherwise be swallowed as a slug value (same
  // literal-vs-:param footgun noted elsewhere in this codebase, e.g.
  // listings.controller.ts's 'mine' vs :id).
  @Public()
  @Get('categories')
  listCategories() {
    return this.blog.listCategories();
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Post('categories')
  createCategory(@Body() body: CreateBlogCategoryDto) {
    return this.blog.createCategory(body);
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.blog.findPublishedBySlug(slug);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Post()
  create(@Req() req: any, @Body() body: CreateBlogPostDto) {
    return this.blog.create(req.user.id, body);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateBlogPostDto) {
    return this.blog.update(id, body);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() body: SetBlogPostStatusDto) {
    return this.blog.setStatus(id, body.status);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blog.remove(id);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Post(':id/cover')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCover(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const url = await this.blogMedia.upload(`blog/${id}`, file);
    return this.blog.update(id, { coverImageUrl: url });
  }
}
