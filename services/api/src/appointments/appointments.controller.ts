import { Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';
import { AppointmentsRepository, AppointmentSubject } from './appointments.repository';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

// Agents AND individual owners both get a calendar — every listing has an
// owner_id, only sometimes an agent_id (listings.repository.ts), so an
// owner-posted listing's "Book a Visit" appointments have nowhere else to
// land. super_admin bypasses ownership checks below but has no subject of
// their own to create/list appointments under.
@Controller('appointments')
@UseGuards(ScopeGuard)
@Roles('agent', 'super_admin')
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsRepository) {}

  @Post()
  create(@Req() req: any, @Body() body: CreateAppointmentDto) {
    return this.appointments.create(this.subjectFor(req), body);
  }

  @Get()
  list(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.appointments.list(this.subjectFor(req), { from, to });
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: UpdateAppointmentDto) {
    await this.assertOwnAppointmentOrAdmin(req, id);
    return this.appointments.update(id, body);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.assertOwnAppointmentOrAdmin(req, id);
    return this.appointments.remove(id);
  }

  private subjectFor(req: any): AppointmentSubject {
    return req.user.role === 'owner' ? { ownerId: req.user.id } : { agentId: req.user.agentId };
  }

  private async assertOwnAppointmentOrAdmin(req: any, appointmentId: string) {
    if (req.user.role === 'super_admin') return;
    const subject = await this.appointments.findSubject(appointmentId);
    if (!subject) throw new NotFoundException('Appointment not found');
    const mine = req.user.role === 'owner' ? subject.ownerId === req.user.id : subject.agentId === req.user.agentId;
    if (!mine) throw new ForbiddenException("Cannot access another user's appointment");
  }
}
