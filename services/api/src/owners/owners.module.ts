import { Module } from '@nestjs/common';
import { OwnersController } from './owners.controller';
import { OwnersRepository } from './owners.repository';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  controllers: [OwnersController],
  providers: [OwnersRepository],
})
export class OwnersModule {}
