import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

// Public "Contact Us" intake — unauthenticated, no listing to attach to
// (unlike leads/dto/create-lead.dto.ts, which requires a listingId). Shared
// by three real callers with different real-world requirements: apps/mobile's
// ContactScreen (name/phone/email/subject/message, all validated non-empty
// client-side), apps/mobile's ProjectDetailScreen enquiry dialog (phone is
// genuinely optional there), and apps/web's Consultation ("Request a
// Callback") form (city/purpose/budget, only form this DTO's `city` field
// applies to). Client requirement, verbatim: "Phone Number and City should
// be mandatory fields. All other fields should remain optional" — but that's
// specific to the Consultation form; making phone required at the DTO level
// would break ProjectDetailScreen's genuinely-optional phone field, so
// "mandatory" is enforced only where it actually applies: the `required`
// attribute on Consultation.tsx's own phone/city inputs.
export class CreateContactMessageDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  message?: string;

  // Not enforced required at the DTO level even though the client wants
  // City mandatory — this DTO is shared with apps/mobile's ContactScreen,
  // which has no city field at all and would break if the server enforced
  // it. "Mandatory" is enforced where it actually applies: the `required`
  // attribute on apps/web/components/contact-us/Consultation.tsx's city
  // select, the one form this requirement is actually about.
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  budget?: string;

  // Set when this message came from an Agency detail page's "Send Your
  // Question" form (apps/web /agents/[slug]) — every other caller omits it.
  @IsOptional()
  @IsUUID()
  agencyId?: string;
}
