import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

// Agency-scoped counterpart to users/dto/create-user.dto.ts's agent branch —
// role and agencyId are never client-supplied here: role is always 'agent',
// agencyId is always forced from the :id route param (see
// agencies.controller.ts::addStaff).
export class CreateAgencyStaffDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}
