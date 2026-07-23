import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';
import { AgenciesRepository } from './agencies.repository';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { SetAgencyVerificationStatusDto } from './dto/set-verification-status.dto';
import { UploadOnboardingDocumentDto } from './dto/upload-document.dto';

@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agencies: AgenciesRepository) {}

  @Public()
  @Get()
  list(@Query('city') city?: string) {
    return this.agencies.list({ city });
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.agencies.findBySlug(slug);
  }

  // Property inventory by type/purpose — confirmed real on a scraped Zameen
  // agency page, computed at query time (see agencies.repository.ts::getStats).
  @Public()
  @Get(':slug/stats')
  async getStats(@Param('slug') slug: string) {
    const agency = await this.agencies.findBySlug(slug);
    return this.agencies.getStats((agency as any).id);
  }

  // Registration/onboarding is a Super Admin action for now — matches
  // [Spec §7] "Agents are onboarded through a verification process".
  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Post()
  create(@Body() body: CreateAgencyDto) {
    return this.agencies.create(body);
  }

  // The write-mechanism explicitly deferred at create-time — every agency
  // starts 'pending' and previously had no way to ever move out of it.
  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch(':id/verify')
  setVerificationStatus(@Param('id') id: string, @Body() body: SetAgencyVerificationStatusDto) {
    return this.agencies.setVerificationStatus(id, body.status);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateAgencyDto) {
    return this.agencies.update(id, body);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agencies.remove(id);
  }

  // Real onboarding requirement — company registration, owner's ID card, tax
  // certificate. Matches the existing agency-mutation discipline (super_admin-only).
  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Param('id') id: string,
    @Body() body: UploadOnboardingDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.agencies.addDocument(id, body.documentType, file);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Get(':id/documents')
  listDocuments(@Param('id') id: string) {
    return this.agencies.listDocuments(id);
  }
}
