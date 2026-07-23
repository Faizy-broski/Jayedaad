import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ScopeGuard } from '../common/guards/scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { VerificationRepository } from './verification.repository';

// Verification Staff's primary daily-use screen. Must NOT be reachable by
// 'agent' — no @Roles('agent') here, satisfying [Dev Instr §2.2].
@UseGuards(ScopeGuard)
@Roles('verification_staff', 'super_admin')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verification: VerificationRepository) {}

  @Get('queue')
  queue() {
    return this.verification.listQueue();
  }

  @Post(':id/approve')
  approve(@Req() req: any, @Param('id') id: string, @Body('note') note?: string) {
    return this.verification.recordAction(req.user.id, id, 'approve', note);
  }

  @Post(':id/reject')
  reject(@Req() req: any, @Param('id') id: string, @Body('note') note?: string) {
    return this.verification.recordAction(req.user.id, id, 'reject', note);
  }

  @Post(':id/request-info')
  requestInfo(@Req() req: any, @Param('id') id: string, @Body('note') note?: string) {
    return this.verification.recordAction(req.user.id, id, 'request_info', note);
  }

  // Read-back for verification_audit_log. Method-level @Roles() overrides the
  // class-level one (ScopeGuard uses getAllAndOverride) — deliberately
  // super_admin-only, not verification_staff, since broad cross-reviewer
  // audit visibility is an oversight capability, not staff's daily-use queue.
  @Roles('super_admin')
  @Get('audit-log')
  auditLog(
    @Query('listingId') listingId?: string,
    @Query('reviewerId') reviewerId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.verification.listAuditLog({
      listingId,
      reviewerId,
      dateFrom,
      dateTo,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }
}
