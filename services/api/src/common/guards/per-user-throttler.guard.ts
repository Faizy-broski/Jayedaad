import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

// Default ThrottlerGuard trackers every request by req.ip alone — fine for
// a single caller, but wrong for this app's actual dev/test setup: everyone
// on the same network/NAT (two developers, plus a phone testing the mobile
// app over the same Wi-Fi) shares ONE apparent IP, and therefore one shared
// rate-limit bucket. Once any one of them burns through it, every request
// from anyone on that network gets a 429 — which the frontend (at the time
// this was written) rendered indistinguishably from "no data", making it
// look like a mysterious bug that only "restarting the server" fixed
// (restarting reset the in-memory counter — see httpClient.ts's response
// interceptor for the other half of this fix).
//
// Keyed on the raw bearer token instead of req.user.id deliberately — this
// guard and JwtAuthGuard are both registered as separate global APP_GUARD
// providers in different modules (app.module.ts vs auth.module.ts), and
// their relative execution order isn't something to depend on. Reading the
// Authorization header directly works regardless of whether JwtAuthGuard
// has already populated req.user by the time this runs. Falls back to IP
// for genuinely unauthenticated requests (a signed-out buyer browsing
// public listings), where per-request-source limiting is still the right
// behavior.
@Injectable()
export class PerUserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const header = req.headers?.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice('Bearer '.length);
    }
    return req.ip;
  }
}
