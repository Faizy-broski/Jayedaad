import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountRepository } from './account.repository';

@Module({
  controllers: [AccountController],
  providers: [AccountRepository],
})
export class AccountModule {}
