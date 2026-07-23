import { IsIn } from 'class-validator';

const ALERT_FREQUENCIES = ['instant', 'daily', 'weekly', 'off'] as const;

export class UpdateSavedSearchDto {
  @IsIn(ALERT_FREQUENCIES)
  alertFrequency!: (typeof ALERT_FREQUENCIES)[number];
}
