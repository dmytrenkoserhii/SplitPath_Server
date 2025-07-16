import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateGlobalChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  @ApiProperty({
    description: 'Content of the private message',
    maxLength: 1000,
    example: 'Hello, how are you?',
  })
  content: string;
}
