import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { PasswordResetService } from './password-reset.service';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';

// Both routes are @Public() — the user isn't logged in yet, that's the whole
// point of this flow. Explicit ThrottlerGuard (not just the global default)
// with tight limits: this is the most sensitive unauthenticated surface in
// the API — email enumeration risk on /request, password-change risk on
// /confirm.
@UseGuards(ThrottlerGuard)
@Controller('auth/password-reset')
export class PasswordResetController {
  constructor(private readonly passwordReset: PasswordResetService) {}

  @Public()
  @Post('request')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  request(@Body() body: RequestPasswordResetDto) {
    return this.passwordReset.requestReset(body.email);
  }

  @Public()
  @Post('confirm')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  confirm(@Body() body: ConfirmPasswordResetDto) {
    return this.passwordReset.confirmReset(body.email, body.code, body.newPassword);
  }
}
