import { Module } from '@nestjs/common';
import { RemindersController } from './reminders.controller';
import { RemindersRepository } from './reminders.repository';
import { RemindersService } from './reminders.service';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [LeadsModule],
  controllers: [RemindersController],
  providers: [RemindersRepository, RemindersService],
})
export class RemindersModule {}
