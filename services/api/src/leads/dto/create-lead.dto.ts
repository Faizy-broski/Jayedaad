import { IsBoolean, IsEmail, IsIn, IsOptional, IsPhoneNumber, IsString, Length, IsUUID } from 'class-validator';

const LEAD_SOURCES = ['chatbot', 'contact_form', 'call_request'] as const;
const INQUIRER_TYPES = ['buyer_tenant', 'agent', 'other'] as const;

// Public intake DTO — a buyer submitting a contact-form inquiry has no
// account. Exactly one of listingId/projectId must be set — enforced in
// LeadsRepository.create() (not decorator-expressible as a clean XOR), and
// mirrored by the DB's leads_listing_or_project_chk constraint
// (0044_leads_project_enquiries.sql) as defense-in-depth. Originally
// listing_id was a hard-required FK per [Dev Instr §3.1] "Property Enquired
// About"; projectId was added later for the project-detail-page enquiry
// form, which has no listing to attach to.
// message/inquirerType/wantsSimilarAlerts verified against a real Zameen.com
// "Contact Agent" form via live scrape, not guessed.
export class CreateLeadDto {
  @IsOptional()
  @IsUUID()
  listingId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsString()
  @Length(1, 120)
  name!: string;

  // Region-locked — every real caller of this public endpoint is a Pakistani
  // buyer/tenant inquiring about a Pakistani listing (same assumption
  // PAKISTAN_CITIES/COUNTRIES-with-PK-default make elsewhere in this app).
  // Unregioned @IsPhoneNumber() validates unpredictably against bare local
  // numbers without a country code.
  @IsPhoneNumber('PK')
  phone!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Length(1, 2000)
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
