import { IsIn } from 'class-validator';

export class SetListingStatusDto {
  @IsIn(['pending_verification', 'verified', 'rejected', 'expired', 'deleted', 'downgraded', 'inactive'])
  status!: 'pending_verification' | 'verified' | 'rejected' | 'expired' | 'deleted' | 'downgraded' | 'inactive';
}
