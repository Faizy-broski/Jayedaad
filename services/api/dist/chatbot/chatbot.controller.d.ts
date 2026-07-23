import { RoleCapabilityResolver } from './role-capability.resolver';
export declare class ChatbotController {
    private readonly capabilities;
    constructor(capabilities: RoleCapabilityResolver);
    handleMessage(req: any, _message: string): Promise<{
        reply: string;
        availableTools: import("./role-capability.resolver").ChatbotTool[];
    }>;
}
