export interface CreateContactMessageInput {
    name: string;
    phone?: string;
    email: string;
    subject?: string;
    message: string;
}
export declare const contactRepository: {
    submit: (input: CreateContactMessageInput) => Promise<void>;
};
