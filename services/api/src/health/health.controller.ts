import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('health')
export class HealthController {
  constructor(private readonly supabase: SupabaseService) {}

  @Public()
  @Get()
  async check() {
    // Readiness, not just liveness — a load balancer/uptime monitor should
    // be able to tell "process is up" apart from "process is up but can't
    // reach the database", since those need different responses.
    const { error } = await this.supabase.client.from('profiles').select('id').limit(1);

    if (error) {
      throw new ServiceUnavailableException({
        status: 'degraded',
        service: 'jayedaad-api',
        database: 'unreachable',
        timestamp: new Date().toISOString(),
      });
    }

    return { status: 'ok', service: 'jayedaad-api', database: 'reachable', timestamp: new Date().toISOString() };
  }
}
