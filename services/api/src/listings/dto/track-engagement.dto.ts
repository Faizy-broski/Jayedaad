import { IsIn, IsString } from 'class-validator';

const ENGAGEMENT_TYPES = ['view', 'click', 'call', 'whatsapp', 'sms', 'email'] as const;
const PLATFORMS = ['web', 'mobile', 'agent_portal', 'admin'] as const;

// Confirmed real on the Profolio agent dashboard's Analytics card: Views,
// Clicks, Calls, WhatsApp, SMS, Emails are all distinct tracked events
// (Leads is separate, backed by the `leads` table). Public — any visitor
// triggers these, not just authenticated users.
export class TrackEngagementDto {
  @IsIn(ENGAGEMENT_TYPES)
  type!: (typeof ENGAGEMENT_TYPES)[number];

  @IsIn(PLATFORMS)
  platform!: (typeof PLATFORMS)[number];

  @IsString()
  viewerSessionId!: string;
}
