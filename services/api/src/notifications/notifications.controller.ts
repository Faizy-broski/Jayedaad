import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ScopeGuard } from '../common/guards/scope.guard';
import { NotificationsRepository } from './notifications.repository';

@UseGuards(ScopeGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsRepository) {}

  @Get()
  list(@Req() req: any) {
    return this.notifications.list(req.user.id);
  }

  @Patch(':id/read')
  markRead(@Req() req: any, @Param('id') id: string) {
    return this.notifications.markRead(req.user.id, id);
  }

  @Patch('read-all')
  markAllRead(@Req() req: any) {
    return this.notifications.markAllRead(req.user.id);
  }
}
