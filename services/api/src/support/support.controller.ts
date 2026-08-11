import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ScopeGuard } from '../common/guards/scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SupportRepository } from './support.repository';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { UpdateSupportTicketStatusDto } from './dto/update-support-ticket-status.dto';

@UseGuards(ScopeGuard)
@Controller('support/tickets')
export class SupportController {
  constructor(private readonly support: SupportRepository) {}

  // Agent-facing help desk (apps/web /help) — agency admins are still role
  // 'agent', so no separate check needed here.
  @Roles('agent')
  @Post()
  create(@Req() req: any, @Body() body: CreateSupportTicketDto) {
    return this.support.create(req.user.id, req.user.agentId, body);
  }

  @Roles('agent')
  @Get('mine')
  listMine(@Req() req: any, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.support.listMine(req.user.id, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Roles('super_admin')
  @Get()
  listAll(
    @Query('status') status?: 'open' | 'in_progress' | 'resolved',
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.support.listAll({
      status,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Roles('super_admin')
  @Patch(':id')
  updateStatus(@Param('id') id: string, @Body() body: UpdateSupportTicketStatusDto) {
    return this.support.updateStatus(id, body);
  }

  // Agent editing/deleting their own ticket — distinct paths from the
  // super_admin PATCH/:id status route above (same method+base path can't
  // be registered twice). Only allowed while status is still 'open' —
  // enforced in SupportRepository, not just hidden client-side.
  @Roles('agent')
  @Patch(':id/edit')
  updateOwn(@Req() req: any, @Param('id') id: string, @Body() body: UpdateSupportTicketDto) {
    return this.support.updateOwn(req.user.id, id, body);
  }

  // Shared by both roles: an agent can only delete their own still-open
  // ticket (enforced in SupportRepository); a super_admin can delete any
  // ticket regardless of owner/status — one route, role-branched in the
  // repository, rather than two handlers colliding on the same path+method.
  @Roles('agent', 'super_admin')
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.support.remove(req.user.id, req.user.role, id);
  }
}
