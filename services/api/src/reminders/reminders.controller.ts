import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ScopeGuard } from '../common/guards/scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RemindersRepository } from './reminders.repository';
import { CreateReminderDto } from './dto/create-reminder.dto';

// Nested under leads (same convention as notes/status in
// leads.controller.ts) — a reminder always belongs to exactly one lead.
@UseGuards(ScopeGuard)
@Roles('agent', 'super_admin')
@Controller()
export class RemindersController {
  constructor(private readonly reminders: RemindersRepository) {}

  @Get('crm/leads/:leadId/reminders')
  listForLead(@Req() req: any, @Param('leadId') leadId: string) {
    return this.reminders.listForLead(req.user, leadId);
  }

  @Post('crm/leads/:leadId/reminders')
  create(@Req() req: any, @Param('leadId') leadId: string, @Body() body: CreateReminderDto) {
    return this.reminders.create(req.user, leadId, body);
  }

  @Delete('reminders/:id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.reminders.remove(req.user, id);
  }
}
