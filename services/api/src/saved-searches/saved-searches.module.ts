import { Module } from '@nestjs/common';
import { SavedSearchesController } from './saved-searches.controller';
import { SavedSearchesRepository } from './saved-searches.repository';

@Module({
  controllers: [SavedSearchesController],
  providers: [SavedSearchesRepository],
})
export class SavedSearchesModule {}
