import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@Injectable()
export class ContactRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async create(input: CreateContactMessageDto) {
    const { data, error } = await this.supabase.client
      .from('contact_messages')
      .insert({
        name: input.name,
        phone: input.phone,
        email: input.email,
        subject: input.subject,
        message: input.message,
        city: input.city,
        purpose: input.purpose,
        budget: input.budget,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
