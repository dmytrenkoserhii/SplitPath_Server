import { IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiProperty({
    description: 'The Lemon Squeezy variant ID of the product',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  productId: string;
}
