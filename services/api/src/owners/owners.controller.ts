import { Body, Controller, Get, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../common/decorators/roles.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';
import { OwnersRepository } from './owners.repository';
import { UploadOwnerIdentityDocumentDto } from './dto/upload-identity-document.dto';
import { SetOwnerVerificationStatusDto } from './dto/set-verification-status.dto';

@Controller('owners')
export class OwnersController {
  constructor(private readonly owners: OwnersRepository) {}

  // Staff review queue — mirrors GET /agents/pending-verification.
  @UseGuards(ScopeGuard)
  @Roles('super_admin', 'verification_staff')
  @Get('pending-verification')
  listPendingVerification() {
    return this.owners.listPendingVerification();
  }

  // Self-service buyer -> owner promotion — the missing link that lets
  // anyone actually reach the rest of this controller (every other route
  // here is @Roles('owner')-gated, but nothing ever granted that role
  // until now). No approval needed, see promoteToOwner()'s comment.
  @UseGuards(ScopeGuard)
  @Roles('buyer')
  @Post('become-owner')
  becomeOwner(@Req() req: any) {
    return this.owners.promoteToOwner(req.user.id);
  }

  // Self-service only — an owner's identity verification is scoped to their
  // own account (req.user.id), never addressable by another owner's id.
  @UseGuards(ScopeGuard)
  @Roles('owner')
  @Get('me/verification')
  getMyVerification(@Req() req: any) {
    return this.owners.getVerification(req.user.id);
  }

  @UseGuards(ScopeGuard)
  @Roles('owner')
  @Post('me/documents')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(@Req() req: any, @Body() body: UploadOwnerIdentityDocumentDto, @UploadedFile() file: Express.Multer.File) {
    return this.owners.addDocument(req.user.id, body.documentType, file);
  }

  // verification_staff/super_admin can review a specific owner's actual
  // CNIC/selfie documents ahead of a verify/reject decision — mirrors
  // AgentsController's GET :id/documents. No self-access branch like
  // agents' assertOwnAgentOrAdmin: an owner already has their own
  // GET /owners/me/verification for that, scoped to req.user.id.
  @UseGuards(ScopeGuard)
  @Roles('super_admin', 'verification_staff')
  @Get(':id/documents')
  listDocuments(@Param('id') id: string) {
    return this.owners.listDocumentsForAdmin(id);
  }

  // Admin upload-on-behalf — same allowance agents.controller.ts's
  // POST :id/documents gives super_admin for a stuck agent, extended to
  // verification_staff here since they're the ones actually working this
  // queue day to day.
  @UseGuards(ScopeGuard)
  @Roles('super_admin', 'verification_staff')
  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocumentForOwner(
    @Param('id') id: string,
    @Body() body: UploadOwnerIdentityDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.owners.addDocument(id, body.documentType, file);
  }

  @UseGuards(ScopeGuard)
  @Roles('super_admin', 'verification_staff')
  @Patch(':id/verify')
  setVerificationStatus(@Param('id') id: string, @Body() body: SetOwnerVerificationStatusDto) {
    return this.owners.setVerificationStatus(id, body.status);
  }
}
