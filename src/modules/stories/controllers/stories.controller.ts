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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';

import { CurrentSession } from '@/modules/auth/decorators';
import { AccessTokenGuard } from '@/modules/auth/guards';
import { PaginatedResponse } from '@/shared/types';

import { PAGINATED_STORIES_RESPONSE_EXAMPLE, STORY_RESPONSE_EXAMPLE } from '../constants';
import { CreateStoryDto, UpdateStoryDto, UpdateStorySegmentDto } from '../dtos';
import { Story, StorySegment } from '../entities';
import { StoriesAIService, StoriesService, StorySegmentsService } from '../services';

@ApiTags('Stories')
@Controller('stories')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
export class StoriesController {
  constructor(
    private readonly storiesService: StoriesService,
    private readonly storiesAiService: StoriesAIService,
    private readonly storySegmentsService: StorySegmentsService,
  ) {}

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
    @CurrentSession('sub') sub: number,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('sort') sort?: string,
  ): Promise<PaginatedResponse<Story>> {
    return this.storiesService.findAllPaginated(sub, page, limit, sort);
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
    return this.storiesService.findOneById(id, ['segments', 'storyTopic']);
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
  create(
    @CurrentSession('sub') sub: number,
    @Body() createStoryDto: CreateStoryDto,
  ): Promise<Story> {
    return this.storiesService.create(createStoryDto, sub);
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

  @Patch(':storyId/segments/:segmentId')
  @ApiOperation({ summary: 'Update story segment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Story segment updated successfully',
    type: StorySegment,
  })
  updateSegment(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Param('segmentId', ParseIntPipe) segmentId: number,
    @Body() updateDto: UpdateStorySegmentDto,
  ): Promise<StorySegment> {
    return this.storySegmentsService.update(segmentId, updateDto);
  }

  @Post(':id/segments/generate-initial')
  @ApiOperation({ summary: 'Generate initial story segment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Initial story segment generated and saved successfully',
    type: StorySegment,
  })
  async generateInitialSegment(@Param('id', ParseIntPipe) id: number): Promise<StorySegment> {
    const story = await this.storiesService.findOneById(id, ['storyTopic']);
    return this.storiesAiService.generateAndSaveInitialSegment(id, story.storyTopic);
  }

  @Post(':id/segments/generate-next')
  @ApiOperation({ summary: 'Generate next story segment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Next story segment generated and saved successfully',
    type: StorySegment,
  })
  async generateNextSegment(@Param('id', ParseIntPipe) id: number): Promise<StorySegment> {
    const story = await this.storiesService.findOneById(id, ['storyTopic', 'segments']);
    return this.storiesAiService.generateAndSaveNextSegment(id, story.storyTopic, story.segments);
  }
}
