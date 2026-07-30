import { useMutation } from '@tanstack/react-query';
import { contactRepository } from '../services/contactRepository';
// Drives the Contact Us form (apps/mobile's ContactScreen today).
export function useContactViewModel() {
    const submit = useMutation({
        mutationFn: contactRepository.submit,
    });
    return { submit };
}
