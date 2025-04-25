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
import { ApiTags } from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';

import { CreateStoryDto, UpdateStoryDto } from '../dtos';
import { StoriesService } from '../services';

@ApiTags('Stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new story' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createStoryDto: CreateStoryDto) {
    return this.storiesService.create(createStoryDto);
  }

  @Get()
  findAll() {
    return this.storiesService.findAll();
  }

  @Get(':id')
  findOneById(@Param('id', ParseIntPipe) id: number) {
    return this.storiesService.findOneById(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateStoryDto: UpdateStoryDto) {
    return this.storiesService.update(id, updateStoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.storiesService.remove(id);
  }
}
