import { httpClient } from './httpClient';

// Mirrors services/api/src/contact/dto/create-contact-message.dto.ts — the
// public Contact Us intake. No listingId (unlike leads' CreateLeadInput):
// this is a general support message, not tied to a property.
export interface CreateContactMessageInput {
  name: string;
  phone?: string;
  email: string;
  subject?: string;
  message: string;
}

export const contactRepository = {
  submit: async (input: CreateContactMessageInput): Promise<void> => {
    await httpClient.post('/contact', input);
  },
};
