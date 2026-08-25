import { IsNumber, IsPositive } from 'class-validator';
import { MarkDealBaseDto } from './mark-sold.dto';

export class MarkRentedDto extends MarkDealBaseDto {
  @IsNumber()
  @IsPositive()
  monthlyRent!: number;
}
