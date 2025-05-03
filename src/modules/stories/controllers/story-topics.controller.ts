import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '@/modules/auth/guards';

import { STORY_TOPIC_RESPONSE_EXAMPLE } from '../constants';
import { CreateStoryTopicDto, UpdateStoryTopicDto } from '../dtos';
import { StoryTopicsService } from '../services';

@ApiTags('Story Topics')
@Controller('story-topics')
export class StoryTopicsController {
  constructor(private readonly storyTopicsService: StoryTopicsService) {}

  @Get()
  @ApiOperation({ summary: 'Find all story topics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all story topics',
    content: {
      'application/json': {
        example: [STORY_TOPIC_RESPONSE_EXAMPLE],
      },
    },
  })
  findAll() {
    return this.storyTopicsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one story topic by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a single story topic',
    content: {
      'application/json': {
        example: STORY_TOPIC_RESPONSE_EXAMPLE,
      },
    },
  })
  findOneById(@Param('id', ParseIntPipe) id: number) {
    return this.storyTopicsService.findOneById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new story topic' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Story topic created successfully',
    content: {
      'application/json': {
        example: STORY_TOPIC_RESPONSE_EXAMPLE,
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  create(@Body() createDto: CreateStoryTopicDto) {
    return this.storyTopicsService.create(createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a story topic' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Story topic updated successfully',
    content: {
      'application/json': {
        example: STORY_TOPIC_RESPONSE_EXAMPLE,
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateStoryTopicDto) {
    return this.storyTopicsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a story topic' })
  @ApiParam({ name: 'id', required: true, description: 'ID of the story topic to delete' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Story topic deleted successfully',
  })
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.storyTopicsService.remove(id);
  }
}
