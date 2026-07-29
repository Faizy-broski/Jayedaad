import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { ContactRepository } from './contact.repository';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

// Public intake: an unauthenticated visitor submitting the Contact Us form
// (apps/web has no equivalent page yet — mobile's ContactScreen is the only
// caller today).
@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactRepository) {}

  @Public()
  @Post()
  create(@Body() body: CreateContactMessageDto) {
    return this.contact.create(body);
  }
}
