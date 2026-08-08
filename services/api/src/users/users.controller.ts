import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ScopeGuard } from '../common/guards/scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-role.dto';
import { Role } from '../common/types';

// User/account management — Super Admin ONLY. Verification Staff and Agent
// must never reach this module, per [Spec §5] / [Dev Instr §2.2/§2.3].
@UseGuards(ScopeGuard)
@Roles('super_admin')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersRepository) {}

  // Backs the "team members" screen — ?role=super_admin,verification_staff
  // pulls just internal staff instead of the full user base.
  @Get()
  list(
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const roles = role ? (role.split(',').map((r) => r.trim()) as Role[]) : undefined;
    return this.users.list({
      roles,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.users.findById(id);
  }

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.users.create(body);
  }

  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() body: UpdateUserRoleDto) {
    return this.users.updateRole(id, body);
  }

  @Patch(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.users.suspend(id);
  }

  @Patch(':id/unsuspend')
  unsuspend(@Param('id') id: string) {
    return this.users.unsuspend(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}
