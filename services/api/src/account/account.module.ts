import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountRepository } from './account.repository';
import { AvatarMediaService } from '../agents/avatar-media.service';

@Module({
  controllers: [AccountController],
  providers: [AccountRepository, AvatarMediaService],
})
export class AccountModule {}
