import { IsBoolean, IsEmail, IsIn, IsOptional, IsPhoneNumber, IsString, IsUUID } from 'class-validator';

const LEAD_SOURCES = ['chatbot', 'contact_form', 'call_request'] as const;
const INQUIRER_TYPES = ['buyer_tenant', 'agent', 'other'] as const;

// Public intake DTO — a buyer submitting a contact-form inquiry has no
// account. listing_id is a hard FK per [Dev Instr §3.1] "Property Enquired
// About": every lead links to a real listing, never a free-text note.
// message/inquirerType/wantsSimilarAlerts verified against a real Zameen.com
// "Contact Agent" form via live scrape, not guessed.
export class CreateLeadDto {
  @IsUUID()
  listingId!: string;

  @IsString()
  name!: string;

  @IsPhoneNumber()
  phone!: string;

  @IsEmail()
  email!: string;

  @IsString()
  message!: string;

  @IsIn(LEAD_SOURCES)
  source!: (typeof LEAD_SOURCES)[number];

  @IsOptional()
  @IsIn(INQUIRER_TYPES)
  inquirerType?: (typeof INQUIRER_TYPES)[number];

  @IsOptional()
  @IsBoolean()
  wantsSimilarAlerts?: boolean;

  // Set when this lead comes from the listing's "Book a Visit" action
  // (as opposed to a plain "Send Enquiry") — triggers a linked 'requested'
  // appointment on the listing's agent's calendar (Document Verification
  // Phase 3), not just a lead row.
  @IsOptional()
  @IsBoolean()
  isVisitRequest?: boolean;
}
