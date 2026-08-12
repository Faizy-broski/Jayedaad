import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsRepository } from './projects.repository';
import { ProjectMediaService } from './project-media.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  // SubscriptionsModule for EntitlementsService — real project-quota
  // enforcement in ProjectsRepository.create(), mirroring ListingsModule's
  // identical import for the same reason.
  imports: [SubscriptionsModule],
  controllers: [ProjectsController],
  providers: [ProjectsRepository, ProjectMediaService],
})
export class ProjectsModule {}
