import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';

import { CreateStoryTopicDto } from './create-story-topic.dto';

export class CreateStoryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ValidateNested()
  @Type(() => CreateStoryTopicDto)
  @IsNotEmpty()
  topicId: number;
}
