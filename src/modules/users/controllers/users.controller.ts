import { DeleteResult } from 'typeorm';

import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateUserDto, UpdateUserDto } from '../dtos';
import { User } from '../entities';
import { UsersService } from '../services';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Find all users' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return all users', type: [User] })
  @Get()
  public findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return current user', type: User })
  @Get(':id')
  public async getCurrent(@Param('id') id: number): Promise<User> {
    return this.usersService.findOneById(id);
  }

  @ApiOperation({ summary: 'Find user by email' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return user by email', type: User })
  @Get('email/:email')
  public async findOneByEmail(@Param('email') email: string): Promise<User> {
    return this.usersService.findOneByEmail(email);
  }

  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created successfully', type: User })
  @Post()
  public async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully', type: User })
  @Patch(':id')
  public async update(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User deleted successfully' })
  @Delete(':id')
  public async delete(@Param('id') id: number): Promise<DeleteResult> {
    return this.usersService.deleteById(id);
  }
}
