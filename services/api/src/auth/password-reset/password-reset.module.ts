import { Module } from '@nestjs/common';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';
import { OtpRepository } from '../otp/otp.repository';
import { MailerService } from '../otp/mailer.service';

@Module({
  controllers: [PasswordResetController],
  // Reuses OtpModule's repository/mailer directly rather than duplicating
  // them — both are cheap, stateless providers, so re-declaring them here
  // (Nest scopes providers per-module) is simpler than exporting from OtpModule.
  providers: [PasswordResetService, OtpRepository, MailerService],
})
export class PasswordResetModule {}
