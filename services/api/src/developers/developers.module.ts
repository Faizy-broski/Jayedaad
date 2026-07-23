import { Module } from '@nestjs/common';
import { DevelopersController } from './developers.controller';
import { DevelopersRepository } from './developers.repository';

@Module({
  controllers: [DevelopersController],
  providers: [DevelopersRepository],
})
export class DevelopersModule {}
