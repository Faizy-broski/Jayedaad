import { IsIn, IsString } from 'class-validator';

const ENGAGEMENT_TYPES = ['view', 'click', 'call', 'whatsapp', 'sms', 'email'] as const;
const PLATFORMS = ['web', 'mobile', 'agent_portal', 'admin'] as const;

// Mirrors listings/dto/track-engagement.dto.ts — same shape, scoped to
// project_engagement_events instead of listing_engagement_events. Public —
// any visitor triggers these, not just authenticated users.
export class TrackEngagementDto {
  @IsIn(ENGAGEMENT_TYPES)
  type!: (typeof ENGAGEMENT_TYPES)[number];

  @IsIn(PLATFORMS)
  platform!: (typeof PLATFORMS)[number];

  @IsString()
  viewerSessionId!: string;
}
