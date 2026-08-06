import { httpClient } from './httpClient';

// Mirrors services/api/src/contact/dto/create-contact-message.dto.ts — the
// public Contact Us intake. No listingId (unlike leads' CreateLeadInput):
// this is a general support message, not tied to a property. Every field is
// optional at this shared-type level (see the DTO's comment for why —
// three real callers with different requirements); "Phone Number and City
// should be mandatory" is enforced by apps/web/components/contact-us/Consultation.tsx's
// own `required` attributes, the one form that requirement is about.
export interface CreateContactMessageInput {
  name?: string;
  phone?: string;
  email?: string;
  subject?: string;
  message?: string;
  city?: string;
  purpose?: string;
  budget?: string;
}

export const contactRepository = {
  submit: async (input: CreateContactMessageInput): Promise<void> => {
    await httpClient.post('/contact', input);
  },
};
