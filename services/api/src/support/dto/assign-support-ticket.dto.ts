import { IsUUID } from 'class-validator';

// Super Admin assigning a ticket to a specific verification_staff member —
// distinct from UpdateSupportTicketStatusDto (status/note lifecycle).
// staffId's role eligibility (must actually be verification_staff) is
// validated server-side in SupportRepository.assign(), not trusted from
// the client picking an arbitrary user id.
export class AssignSupportTicketDto {
  @IsUUID()
  staffId!: string;
}
