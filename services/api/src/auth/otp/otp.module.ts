import { Module } from '@nestjs/common';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { OtpRepository } from './otp.repository';
import { MailerService } from './mailer.service';

// ThrottlerModule itself is registered once, globally, in app.module.ts —
// OtpController's per-route @Throttle() decorators override that global
// default with the stricter limits this surface needs (send/verify are the
// most abuse-prone routes in the API: free signup + an inbox to spam, or a
// 6-digit code to brute-force).
@Module({
  controllers: [OtpController],
  providers: [OtpService, OtpRepository, MailerService],
})
export class OtpModule {}
