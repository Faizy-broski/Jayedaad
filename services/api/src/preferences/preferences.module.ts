import { Module } from '@nestjs/common';
import { PreferencesController } from './preferences.controller';
import { PreferencesRepository } from './preferences.repository';

@Module({
  controllers: [PreferencesController],
  providers: [PreferencesRepository],
})
export class PreferencesModule {}
