import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Explicit opt-out of authentication for genuinely public endpoints
// (e.g. verified-listing search). Absence of this decorator means "authenticated".
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
