import { PartialType } from '@nestjs/swagger';

import { CreateStoryTopicDto } from './create-story-topic.dto';

export class UpdateStoryTopicDto extends PartialType(CreateStoryTopicDto) {}
