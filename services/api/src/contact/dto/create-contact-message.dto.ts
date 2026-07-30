import { IsEmail, IsOptional, IsString } from 'class-validator';

// Public "Contact Us" intake — unauthenticated, no listing to attach to
// (unlike leads/dto/create-lead.dto.ts, which requires a listingId). Matches
// the fields on apps/mobile's ContactScreen (name/phone/email/subject/message).
export class CreateContactMessageDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  message!: string;
}
