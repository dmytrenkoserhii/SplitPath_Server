import { PartialType } from '@nestjs/swagger';

import { CreateStorySegmentDto } from './create-story-segment.dto';

export class UpdateStorySegmentDto extends PartialType(CreateStorySegmentDto) {}
