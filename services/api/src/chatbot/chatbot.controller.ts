import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ScopeGuard } from '../common/guards/scope.guard';
import { RoleCapabilityResolver } from './role-capability.resolver';

// Every authenticated role can talk to the chatbot — the manifest, not the
// route, is what changes per role [Spec §3].
@UseGuards(ScopeGuard)
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly capabilities: RoleCapabilityResolver) {}

  @Post('message')
  async handleMessage(@Req() req: any, @Body('message') _message: string) {
    const tools = this.capabilities.resolve(req.user.role);
    // Explicitly descoped from this release, not a silent gap — no LLM
    // provider has been chosen yet (see LLM_PROVIDER_API_KEY in
    // .env.example). `implemented: false` lets callers branch on this
    // programmatically instead of pattern-matching the reply text.
    return {
      implemented: false,
      reply: 'Chatbot integration is not yet available.',
      availableTools: tools,
    };
  }
}
