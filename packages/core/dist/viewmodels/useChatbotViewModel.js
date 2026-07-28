import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { httpClient } from '../services/httpClient';
export function useChatbotViewModel() {
    const [messages, setMessages] = useState([]);
    const send = useMutation({
        mutationFn: async (message) => {
            const { data } = await httpClient.post('/chatbot/message', { message });
            return data;
        },
        onMutate: (message) => {
            setMessages((prev) => [...prev, { role: 'user', text: message }]);
        },
        onSuccess: (data) => {
            setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
        },
    });
    return { messages, send };
}
