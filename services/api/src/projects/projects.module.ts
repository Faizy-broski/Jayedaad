import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsRepository } from './projects.repository';
import { ProjectMediaService } from './project-media.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsRepository, ProjectMediaService],
})
export class ProjectsModule {}
