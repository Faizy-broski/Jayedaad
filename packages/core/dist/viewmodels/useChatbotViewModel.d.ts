interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
}
export declare function useChatbotViewModel(): {
    messages: ChatMessage[];
    send: import("@tanstack/react-query").UseMutationResult<{
        reply: string;
    }, Error, string, void>;
};
export {};
