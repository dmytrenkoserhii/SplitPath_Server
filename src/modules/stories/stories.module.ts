import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StoriesController, StoryTopicsController } from './controllers';
import { Story, StorySegment, StoryTopic } from './entities';
import {
  StoriesAIService,
  StoriesService,
  StorySegmentsService,
  StoryTopicsService,
} from './services';

@Module({
  imports: [TypeOrmModule.forFeature([Story, StorySegment, StoryTopic])],
  controllers: [StoriesController, StoryTopicsController],
  providers: [StoriesService, StorySegmentsService, StoryTopicsService, StoriesAIService],
})
export class StoriesModule {}
