import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ScopeGuard } from '../../common/guards/scope.guard';
import { OtpService } from './otp.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';

// Self-scoped to req.user.id, no @Roles() restriction — any authenticated
// user can verify their own email. Sits behind the global JwtAuthGuard, which
// is all that's needed: the user already has a session from signUp(), they
// just aren't email_verified yet. ThrottlerGuard is applied globally
// (app.module.ts) — @Throttle() below just overrides its default per-route.
@UseGuards(ScopeGuard)
@Controller('auth/otp')
export class OtpController {
  constructor(private readonly otp: OtpService) {}

  @Post('send')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  send(@Req() req: any) {
    return this.otp.sendCode(req.user.id);
  }

  @Post('verify')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verify(@Req() req: any, @Body() body: VerifyOtpDto) {
    return this.otp.verifyCode(req.user.id, body.code);
  }

  @Get('status')
  status(@Req() req: any) {
    return this.otp.getStatus(req.user.id);
  }
}
