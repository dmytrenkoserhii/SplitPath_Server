import { DeleteResult } from 'typeorm';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentSession } from '@/modules/auth/decorators/current-session.decorator';
import { AccessTokenGuard } from '@/modules/auth/guards';

import { ConfirmEmailDto, UpdateUserDto } from '../dtos';
import { User } from '../entities';
import { UsersService, VerificationService } from '../services';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly verificationService: VerificationService,
  ) {}

  @ApiOperation({ summary: 'Find all users' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return all users', type: [User] })
  @Get()
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  public findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return current user', type: User })
  @Get('current')
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  public async getCurrent(@CurrentSession('sub') sub: number): Promise<User> {
    return this.usersService.findOneById(sub, ['account']);
  }

  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return user by id', type: User })
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  public async findOneById(@Param('id') id: number): Promise<User> {
    return this.usersService.findOneById(id, ['account']);
  }

  @ApiOperation({ summary: 'Find user by email' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return user by email', type: User })
  @Get('email/:email')
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  public async findOneByEmail(@Param('email') email: string): Promise<User | null> {
    return this.usersService.findOneByEmail(email, ['account']);
  }

  // TODO: not sure if we need this endpoint
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully', type: User })
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  public async update(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User deleted successfully' })
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  public async delete(@Param('id') id: number): Promise<DeleteResult> {
    return this.usersService.deleteById(id);
  }

  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Email verified successfully' })
  @ApiBody({ type: ConfirmEmailDto })
  @Post('verify-email')
  public async confirmEmail(@Body() confirmEmailDto: ConfirmEmailDto): Promise<void> {
    await this.verificationService.confirmEmail(confirmEmailDto);
  }

  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Verification email sent' })
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  @Get('resend-verification')
  public async resendVerificationEmail(@CurrentSession('sub') sub: number): Promise<void> {
    await this.verificationService.resendConfirmationLink(sub);
  }
}
