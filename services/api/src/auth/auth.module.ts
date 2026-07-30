import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OtpModule } from './otp/otp.module';
import { PasswordResetModule } from './password-reset/password-reset.module';

@Module({
  imports: [OtpModule, PasswordResetModule],
  providers: [
    {
      // Applied globally: every route is authenticated by default,
      // routes opt OUT via @Public() (see jwt-auth.guard.ts).
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AuthModule {}
