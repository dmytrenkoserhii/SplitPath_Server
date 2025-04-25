import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateStoryTopicDto {
  @ApiProperty({ description: 'Name of the story topic' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description of the story topic', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
