import { IsOptional, IsUUID, Matches } from 'class-validator';

export class CheckoutCreditPackDto {
  @IsUUID()
  packId!: string;

  // Same mobile deep-link convention as CreateCheckoutSessionDto.returnUrl.
  @IsOptional()
  @Matches(/^jayedaad:\/\//, { message: 'returnUrl must use the jayedaad:// scheme' })
  returnUrl?: string;
}
