import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreatePrivateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  @ApiProperty({
    description: 'Content of the private message',
    maxLength: 1000,
    example: 'Hello, how are you?',
  })
  content: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID of the user to send the message to',
    example: 1,
  })
  toUserId: number;
}
