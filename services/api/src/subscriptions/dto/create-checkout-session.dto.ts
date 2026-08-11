import { IsOptional, IsUUID, Matches } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsUUID()
  tierId!: string;

  // Mobile passes Linking.createURL('plan') (resolves to 'jayedaad://plan')
  // so Stripe redirects back into the app instead of the web dashboard —
  // web omits this and keeps using the NEXT_PUBLIC_SITE_URL default.
  // Restricted to the app's own scheme, not an arbitrary URL, so this can't
  // be used as an open redirect.
  @IsOptional()
  @Matches(/^jayedaad:\/\//, { message: 'returnUrl must use the jayedaad:// scheme' })
  returnUrl?: string;
}
