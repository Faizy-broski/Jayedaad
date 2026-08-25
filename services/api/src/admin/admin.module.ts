import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminRepository } from './admin.repository';
import { RevenueRepository } from './revenue.repository';

@Module({
  controllers: [AdminController],
  providers: [AdminRepository, RevenueRepository],
})
export class AdminModule {}
