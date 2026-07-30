import { ContactRepository } from './contact.repository';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
export declare class ContactController {
    private readonly contact;
    constructor(contact: ContactRepository);
    create(body: CreateContactMessageDto): Promise<any>;
}
