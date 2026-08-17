import { ArrayMinSize, IsArray, IsInt, IsOptional, IsUUID, Matches, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CartItemDto {
  @IsUUID()
  packId!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;
}

// Real multi-item cart — several different credit packs, each with its own
// quantity, paid for in one combined Stripe Checkout session. Distinct from
// CheckoutCreditPackDto (single pack per call), which stays untouched for
// web's existing one-purchase-at-a-time flow.
export class CheckoutCreditCartDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];

  // Same mobile deep-link convention as CheckoutCreditPackDto.returnUrl.
  @IsOptional()
  @Matches(/^jayedaad:\/\//, { message: 'returnUrl must use the jayedaad:// scheme' })
  returnUrl?: string;
}
