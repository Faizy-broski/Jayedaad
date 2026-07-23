import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { Role } from '../common/types';

export interface AuthenticatedUser {
  id: string;
  role: Role;
  agentId?: string;
}

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

// Shape of a Supabase Auth (GoTrue) access token — only the fields we use.
interface SupabaseJwtPayload {
  sub: string;
  app_metadata?: {
    role?: AuthenticatedUser['role'];
    agent_id?: string;
  };
}

// Verifies a Supabase-issued JWT and derives { id, role, agentId } from it.
// Identity itself (sign-up/sign-in) is handled entirely by Supabase Auth on
// the client side — this API only ever verifies tokens, never issues them.
//
// Supabase projects sign tokens one of two ways depending on project
// configuration: the newer asymmetric signing keys (ES256/RS256, verified
// against the project's public JWKS — no shared secret involved at all,
// confirmed live against a real project's tokens), or the older "Legacy
// JWT" shared-secret mode (HS256, SUPABASE_JWT_SECRET). This guard supports
// both, branching on the token's own `alg` header — a fixed HS256-only
// implementation cannot verify an ES256 token no matter what secret value
// is supplied, which is what a real dev-project test surfaced.
//
// role/agentId come from the token's app_metadata claim, which is only
// settable via the Supabase service-role Admin API — never by the end user —
// so it can't be self-escalated by a client.
//
// Every route is authenticated by default; routes must opt OUT via @Public(),
// never opt in — so a missing guard can never silently expose data.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  // Lazy + memoized: only constructed (and only fetches the JWKS on first
  // use) if a token actually needs asymmetric verification.
  private jwks: JWTVerifyGetKey | undefined;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = await this.verify(token);
      request.user = {
        id: payload.sub,
        role: payload.app_metadata?.role ?? 'buyer',
        agentId: payload.app_metadata?.agent_id,
      };
      return true;
    } catch {
      if (isPublic) return true;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async verify(token: string): Promise<SupabaseJwtPayload> {
    const { alg } = decodeProtectedHeader(token);

    if (alg === 'HS256') {
      const secret = process.env.SUPABASE_JWT_SECRET;
      if (!secret) throw new Error('SUPABASE_JWT_SECRET must be set to verify an HS256 (legacy) Supabase token');
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
      return payload as unknown as SupabaseJwtPayload;
    }

    // Asymmetric signing (ES256/RS256) — verify against the project's
    // public JWKS. No secret needed; the key is fetched (and cached, with
    // automatic re-fetch on an unrecognized `kid`) from Supabase directly.
    if (!this.jwks) {
      const supabaseUrl = process.env.SUPABASE_URL;
      if (!supabaseUrl) throw new Error('SUPABASE_URL must be set to verify an asymmetrically-signed Supabase token');
      this.jwks = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));
    }
    const { payload } = await jwtVerify(token, this.jwks);
    return payload as unknown as SupabaseJwtPayload;
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) return undefined;
    return header.slice('Bearer '.length);
  }
}
