import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactRepository } from './contact.repository';

@Module({
  controllers: [ContactController],
  providers: [ContactRepository],
})
export class ContactModule {}
