import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogRepository } from './blog.repository';
import { BlogMediaService } from './blog-media.service';

@Module({
  controllers: [BlogController],
  providers: [BlogRepository, BlogMediaService],
})
export class BlogModule {}
