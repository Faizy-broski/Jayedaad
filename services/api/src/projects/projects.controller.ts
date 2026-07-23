import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';
import { ProjectsRepository } from './projects.repository';
import { CreateProjectDto } from './dto/create-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsRepository) {}

  // Public, unauthenticated — confirmed real on the Zameen New Projects
  // search page: City, Property Type (via the category taxonomy), Budget
  // Range, Area Range, Project Title (keyword) and Developer filters, plus
  // sort/pagination. Mirrors ListingsController.findPublic.
  @Public()
  @Get()
  findPublic(
    @Query('city') city?: string,
    @Query('status') status?: 'planned' | 'under_construction' | 'ready',
    @Query('propertyTypeSlug') propertyTypeSlug?: string,
    @Query('developerSlug') developerSlug?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minAreaValue') minAreaValue?: string,
    @Query('maxAreaValue') maxAreaValue?: string,
    @Query('areaUnit') areaUnit?: 'marla' | 'kanal' | 'sqyd' | 'sqft' | 'sqm' | 'acre',
    @Query('keyword') keyword?: string,
    @Query('sortBy') sortBy?: 'newest' | 'price_asc' | 'price_desc',
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.projects.findPublic({
      city,
      status,
      propertyTypeSlug,
      developerSlug,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minAreaValue: minAreaValue ? Number(minAreaValue) : undefined,
      maxAreaValue: maxAreaValue ? Number(maxAreaValue) : undefined,
      areaUnit,
      keyword,
      sortBy,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  // Backs "Browse Projects by City" (Islamabad 285, Lahore 219, ...).
  @Public()
  @Get('cities')
  listCities() {
    return this.projects.listCitiesWithCounts();
  }

  // Backs "Browse Projects by Category" (Flats 486, Plots 427, ...).
  @Public()
  @Get('categories')
  listCategories() {
    return this.projects.listCategoriesWithCounts();
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.projects.findBySlug(slug);
  }

  // Developer/project onboarding — Super Admin or agent (matches the same
  // roles allowed to submit listings) [Spec §7].
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Post()
  create(@Body() body: CreateProjectDto) {
    return this.projects.create(body);
  }
}
