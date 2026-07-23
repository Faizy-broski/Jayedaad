import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { httpClient } from '../services/httpClient';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export function useChatbotViewModel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const send = useMutation({
    mutationFn: async (message: string) => {
      const { data } = await httpClient.post('/chatbot/message', { message });
      return data as { reply: string };
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
