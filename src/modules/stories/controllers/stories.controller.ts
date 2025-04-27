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
  Query,
} from '@nestjs/common';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';

import { PaginatedResponse } from '@/shared/types';

import { PAGINATED_STORIES_RESPONSE_EXAMPLE, STORY_RESPONSE_EXAMPLE } from '../constants';
import { CreateStoryDto, UpdateStoryDto } from '../dtos';
import { Story } from '../entities';
import { StoriesService } from '../services';

@ApiTags('Stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Find all stories with pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated stories',
    content: {
      'application/json': {
        example: PAGINATED_STORIES_RESPONSE_EXAMPLE,
      },
    },
  })
  findAll(
    @Param('userId', ParseIntPipe) userId: number, // TODO: add CurrentSession
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('sort') sort?: string,
  ): Promise<PaginatedResponse<Story>> {
    return this.storiesService.findAllPaginated(userId, page, limit, sort);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find story by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a single story',
    content: {
      'application/json': {
        example: STORY_RESPONSE_EXAMPLE,
      },
    },
  })
  findOneById(@Param('id', ParseIntPipe) id: number) {
    return this.storiesService.findOneById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new story' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Story created successfully',
    content: {
      'application/json': {
        example: STORY_RESPONSE_EXAMPLE,
      },
    },
  })
  create(@Body() createStoryDto: CreateStoryDto) {
    return this.storiesService.create(createStoryDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update story' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Story updated successfully',
    content: {
      'application/json': {
        example: STORY_RESPONSE_EXAMPLE,
      },
    },
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateStoryDto: UpdateStoryDto) {
    return this.storiesService.update(id, updateStoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a story by ID' })
  @ApiParam({ name: 'id', required: true, description: 'ID of the story to delete' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Story deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.storiesService.remove(id);
  }
}
