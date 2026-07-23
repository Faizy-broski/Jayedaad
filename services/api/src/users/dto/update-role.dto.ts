import { IsIn } from 'class-validator';

const ROLES = ['super_admin', 'verification_staff', 'agent', 'buyer', 'owner'] as const;

export class UpdateUserRoleDto {
  @IsIn(ROLES)
  role!: (typeof ROLES)[number];
}
