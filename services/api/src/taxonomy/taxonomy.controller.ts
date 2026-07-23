import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';
import { TaxonomyRepository } from './taxonomy.repository';
import { CreatePropertyTypeCategoryDto, UpdatePropertyTypeCategoryDto } from './dto/category.dto';
import { CreatePropertyTypeDto, UpdatePropertyTypeDto } from './dto/property-type.dto';
import { CreateAmenityDto, UpdateAmenityDto } from './dto/amenity.dto';

@Controller('taxonomy')
export class TaxonomyController {
  constructor(private readonly taxonomy: TaxonomyRepository) {}

  // Public reads: every search/filter screen (web, mobile, agent portal,
  // admin panel) needs the same taxonomy lists [Spec §9 cross-platform parity].
  @Public()
  @Get('property-type-categories')
  listCategories() {
    return this.taxonomy.listCategories();
  }

  @Public()
  @Get('property-types')
  listPropertyTypes() {
    return this.taxonomy.listPropertyTypes();
  }

  // propertyTypeCategorySlug lets a listing-submission form only fetch
  // amenities relevant to the property type being listed.
  @Public()
  @Get('amenities')
  listAmenities(@Query('propertyTypeCategorySlug') propertyTypeCategorySlug?: string) {
    return this.taxonomy.listAmenities({ propertyTypeCategorySlug });
  }

  // Mutations: Super Admin only [Reqs §9] — full CRUD on all three, not just
  // create. Property-type categories (Homes/Plots/Commercial) are managed
  // data, not a fixed enum, so Super Admin can add/rename/retire them too.
  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Post('property-type-categories')
  createCategory(@Body() body: CreatePropertyTypeCategoryDto) {
    return this.taxonomy.createCategory(body);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch('property-type-categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: UpdatePropertyTypeCategoryDto) {
    return this.taxonomy.updateCategory(id, body);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Delete('property-type-categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.taxonomy.removeCategory(id);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Post('property-types')
  createPropertyType(@Body() body: CreatePropertyTypeDto) {
    return this.taxonomy.createPropertyType(body);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch('property-types/:id')
  updatePropertyType(@Param('id') id: string, @Body() body: UpdatePropertyTypeDto) {
    return this.taxonomy.updatePropertyType(id, body);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Delete('property-types/:id')
  removePropertyType(@Param('id') id: string) {
    return this.taxonomy.removePropertyType(id);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Post('amenities')
  createAmenity(@Body() body: CreateAmenityDto) {
    return this.taxonomy.createAmenity(body);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch('amenities/:id')
  updateAmenity(@Param('id') id: string, @Body() body: UpdateAmenityDto) {
    return this.taxonomy.updateAmenity(id, body);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Delete('amenities/:id')
  removeAmenity(@Param('id') id: string) {
    return this.taxonomy.removeAmenity(id);
  }
}
