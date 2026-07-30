import { IsBoolean } from 'class-validator';

export class SetAgencyStaffAdminDto {
  @IsBoolean()
  isAgencyAdmin!: boolean;
}
