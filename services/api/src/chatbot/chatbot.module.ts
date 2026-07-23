import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { RoleCapabilityResolver } from './role-capability.resolver';

@Module({
  controllers: [ChatbotController],
  providers: [RoleCapabilityResolver],
})
export class ChatbotModule {}
