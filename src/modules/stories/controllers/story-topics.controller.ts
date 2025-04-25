import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateStoryTopicDto, UpdateStoryTopicDto } from '../dtos';
import { StoryTopicsService } from '../services';

@ApiTags('Story Topics')
@Controller('story-topics')
export class StoryTopicsController {
  constructor(private readonly storyTopicsService: StoryTopicsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new story topic' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateStoryTopicDto) {
    return this.storyTopicsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all story topics' })
  findAll() {
    return this.storyTopicsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one story topic by ID' })
  findOneById(@Param('id', ParseIntPipe) id: number) {
    return this.storyTopicsService.findOneById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a story topic' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateStoryTopicDto) {
    return this.storyTopicsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a story topic' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.storyTopicsService.remove(id);
  }
}
