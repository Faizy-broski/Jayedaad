import { Module } from '@nestjs/common';
import { TaxonomyController } from './taxonomy.controller';
import { TaxonomyRepository } from './taxonomy.repository';

@Module({
  controllers: [TaxonomyController],
  providers: [TaxonomyRepository],
})
export class TaxonomyModule {}
