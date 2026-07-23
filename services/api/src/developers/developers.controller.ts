import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';
import { DevelopersRepository } from './developers.repository';
import { CreateDeveloperDto } from './dto/create-developer.dto';
import { UpdateDeveloperDto } from './dto/update-developer.dto';

@Controller('developers')
export class DevelopersController {
  constructor(private readonly developers: DevelopersRepository) {}

  @Public()
  @Get()
  list(@Query('city') city?: string) {
    return this.developers.list({ city });
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.developers.findBySlug(slug);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Post()
  create(@Body() body: CreateDeveloperDto) {
    return this.developers.create(body);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateDeveloperDto) {
    return this.developers.update(id, body);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.developers.remove(id);
  }
}
