import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { ContactRepository } from './contact.repository';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

// Public intake: an unauthenticated visitor submitting the Contact Us form
// (apps/web has no equivalent page yet — mobile's ContactScreen is the only
// caller today).
@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactRepository) {}

  // Tightened below the global ThrottlerModule default (app.module.ts,
  // 100/min) — same override discipline as crm/leads.controller.ts's public
  // intake route, this is the other public unauthenticated write endpoint.
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  create(@Body() body: CreateContactMessageDto) {
    return this.contact.create(body);
  }
}
