import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ScopeGuard } from '../common/guards/scope.guard';
import { TasksRepository } from './tasks.repository';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

// No @Roles() beyond authentication — self-scoped throughout via owner_id,
// same discipline TasksRepository documents.
@UseGuards(ScopeGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksRepository) {}

  @Get()
  list(@Req() req: any) {
    return this.tasks.list(req.user.id);
  }

  @Post()
  create(@Req() req: any, @Body() body: CreateTaskDto) {
    return this.tasks.create(req.user, body);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: UpdateTaskDto) {
    return this.tasks.update(req.user.id, id, body);
  }

  @Patch(':id/complete')
  complete(@Req() req: any, @Param('id') id: string) {
    return this.tasks.complete(req.user.id, id);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.tasks.remove(req.user.id, id);
  }
}
